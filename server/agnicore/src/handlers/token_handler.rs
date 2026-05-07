use std::env;

use axum::extract::State;
use axum::Json;
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use subtle::ConstantTimeEq;
use uuid::Uuid;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct TokenRequest {
    pub user_id: Uuid,
    pub username: String,
    pub role: String,
    pub admin_secret: String,
}

#[derive(Serialize)]
pub struct TokenResponse {
    pub token: String,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    username: String,
    role: String,
    exp: usize,
    iat: usize,
}

fn require_env(name: &str) -> Result<String, crate::errors::AppError> {
    env::var(name).map_err(|_| crate::errors::AppError::InternalServerError)
}

fn jwt_secret() -> Result<String, crate::errors::AppError> {
    let secret = require_env("JWT_SECRET")?;
    if secret.len() < 32 {
        return Err(crate::errors::AppError::InternalServerError);
    }
    Ok(secret)
}

fn validate_role(role: &str) -> Result<(), crate::errors::AppError> {
    let is_valid = !role.is_empty()
        && role.len() <= 32
        && role
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '_' | '-'));

    if is_valid {
        Ok(())
    } else {
        Err(crate::errors::AppError::BadRequest(
            "role must be 1-32 chars and only contain letters, numbers, _ or -".to_string(),
        ))
    }
}

fn validate_username(username: &str) -> Result<(), crate::errors::AppError> {
    let is_valid = !username.is_empty()
        && username.len() <= 32
        && username
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '_' | '-'));

    if is_valid {
        Ok(())
    } else {
        Err(crate::errors::AppError::BadRequest(
            "username must be 1-32 chars and only contain letters, numbers, _ or -".to_string(),
        ))
    }
}

pub async fn issue_token(
    State(_state): State<AppState>,
    Json(req): Json<TokenRequest>,
) -> Result<Json<TokenResponse>, crate::errors::AppError> {
    let issuer_enabled = env::var("ENABLE_DEV_TOKEN_ISSUER").unwrap_or_default() == "true";
    if !issuer_enabled {
        return Err(crate::errors::AppError::Forbidden);
    }

    validate_role(&req.role)?;
    validate_username(&req.username)?;

    let expected_admin_secret = require_env("TOKEN_ISSUER_ADMIN_SECRET")?;
    if !bool::from(req.admin_secret.as_bytes().ct_eq(expected_admin_secret.as_bytes())) {
        return Err(crate::errors::AppError::Unauthorized);
    }

    let secret = jwt_secret()?;
    let now = Utc::now();
    let claims = Claims {
        sub: req.user_id.to_string(),
        username: req.username,
        role: req.role,
        iat: now.timestamp() as usize,
        exp: (now + Duration::hours(1)).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| crate::errors::AppError::InternalServerError)?;

    Ok(Json(TokenResponse { token }))
}
