use std::net::SocketAddr;

use axum::extract::{Json, State};
use axum::http::HeaderMap;
use serde::Deserialize;
use serde_json::json;
use crate::services::auth_service::{AuthService, DefaultAuthService};
use crate::services::risk_service::{RiskService, DefaultRiskService};
use crate::services::policy_service::{PolicyService, DefaultPolicyService};
use crate::services::context_service::{ContextService, DefaultContextService};
use crate::domain::AccessRequest as DomainAccessRequest;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct AccessRequest {
    pub token: String,
    pub resource: String,
    pub action: Option<String>,
}

fn extract_client_ip(headers: &HeaderMap, addr: Option<&SocketAddr>) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().to_string())
        .or_else(|| addr.map(|a| a.ip().to_string()))
        .unwrap_or_else(|| "127.0.0.1".to_string())
}

fn validate_token_length(token: &str) -> Result<(), crate::errors::AppError> {
    let token_len = token.len();
    if token_len == 0 {
        return Err(crate::errors::AppError::BadRequest(
            "Token is required".to_string(),
        ));
    }
    if token_len > 8192 {
        return Err(crate::errors::AppError::BadRequest(
            "Token exceeds maximum length".to_string(),
        ));
    }
    Ok(())
}

fn validate_resource(resource: &str) -> Result<(), crate::errors::AppError> {
    let trimmed = resource.trim();
    let is_valid = !trimmed.is_empty()
        && trimmed.len() <= 128
        && trimmed
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '/' | '_' | '-' | '.' | ' '));

    if is_valid {
        Ok(())
    } else {
        Err(crate::errors::AppError::BadRequest(
            "resource must be 1-128 chars and only contain letters, numbers, /, _, -, or .".to_string(),
        ))
    }
}

pub async fn handle_access(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<AccessRequest>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    validate_token_length(&req.token)?;
    validate_resource(&req.resource)?;

    let auth_service = DefaultAuthService;
    let risk_service = DefaultRiskService;
    let policy_service = DefaultPolicyService;
    let context_service = DefaultContextService;

    let secret = std::env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;
    let (_token_user_id, _token_role) = crate::services::risk_service::validate_token(&req.token, &secret)?;

    let user = auth_service.authenticate(&req.token).await?;

    let client_ip = extract_client_ip(&headers, None);
    let request_count = state.log_repo.count_recent_requests(&user.id.to_string(), 10).await?;

    let mut domain_req = DomainAccessRequest {
        user_id: user.id,
        resource: req.resource.clone(),
        action: req.action.unwrap_or_else(|| "read".to_string()),
        ip: Some(client_ip.clone()),
        request_count,
    };

    context_service.enrich_context(&mut domain_req).await?;

    let risk_score = risk_service.calculate_risk(&domain_req).await?;
    let decision_res = policy_service.evaluate_policy(&domain_req, risk_score).await?;

    let final_risk = risk_score.max(decision_res.risk_score);
    let final_decision = if final_risk >= 60 {
        "DENY"
    } else if final_risk >= 30 {
        "VERIFY"
    } else {
        "ALLOW"
    };

    let location = if client_ip.starts_with("192.168") || client_ip.starts_with("10.") || client_ip == "127.0.0.1" {
        "Trusted"
    } else {
        "External"
    };

    let device = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    state.log_repo.log_access(
        &user.id.to_string(),
        &req.resource,
        &domain_req.action,
        &client_ip,
        device.as_deref(),
        location,
        final_risk,
        final_decision,
        Some(&decision_res.reason),
    ).await?;

    Ok(Json(json!({
        "user": user.username,
        "user_id": user.id,
        "resource": req.resource,
        "risk_score": final_risk,
        "decision": final_decision,
        "reason": decision_res.reason
    })))
}

pub async fn handle_get_logs(
    State(state): State<AppState>,
) -> Result<Json<Vec<crate::domain::models::LogEntry>>, crate::errors::AppError> {
    let logs = state.log_repo.get_recent_logs(50).await?;
    Ok(Json(logs))
}

#[derive(Deserialize)]
pub struct ValidateTokenRequest {
    pub token: String,
}

pub async fn handle_validate_token(
    Json(req): Json<ValidateTokenRequest>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    let auth_service = DefaultAuthService;
    let is_valid = auth_service.validate_token(&req.token).await?;
    Ok(Json(json!({ "valid": is_valid })))
}

pub async fn handle_seed_data(
    State(_state): State<AppState>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    Ok(Json(json!({
        "message": "To seed data, please use the /api/health endpoint or restart the server",
        "note": "Data is automatically seeded on first startup when database is empty"
    })))
}