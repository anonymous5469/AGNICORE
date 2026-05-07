use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::Json;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::domain::user_models::UserResponse;
use crate::services::user_service::UserService;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
    pub confirm_password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    username: String,
    role: String,
    status: String,
    iat: usize,
    exp: usize,
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    let user_service = UserService::new(state.user_repo);
    
    let user = user_service.authenticate_user(&req.username, &req.password).await?;
    
    let user = match user {
        Some(u) => u,
        None => return Err(crate::errors::AppError::Unauthorized),
    };
    
    if user.status != "active" {
        return Err(crate::errors::AppError::Forbidden);
    }
    
    let secret = std::env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;
    let now = Utc::now();
    let claims = Claims {
        sub: user.id.clone(),
        username: user.username.clone(),
        role: user.role.clone(),
        status: user.status.clone(),
        iat: now.timestamp() as usize,
        exp: (now + Duration::hours(1)).timestamp() as usize,
    };
    
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| crate::errors::AppError::InternalServerError)?;
    
    Ok(Json(json!({
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "status": user.status,
        }
    })))
}

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    let user_service = UserService::new(state.user_repo);
    
    let user = user_service.register_user(&req.username, &req.password).await?;
    
    Ok(Json(json!({
        "message": "Registration successful. Pending admin approval.",
        "user_id": user.id,
        "username": user.username,
    })))
}

pub async fn me(
    State(state): State<AppState>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    let token = req.get("token")
        .and_then(|v| v.as_str())
        .ok_or(crate::errors::AppError::BadRequest("Token required".to_string()))?;
    
    let secret = std::env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;
    let token_data = jsonwebtoken::decode::<crate::services::auth_service::Claims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256),
    )
    .map_err(|_| crate::errors::AppError::Unauthorized)?;
    
    let user = state.user_repo.find_by_id(&token_data.claims.sub).await?;
    
    match user {
        Some(u) => Ok(Json(json!({
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "status": u.status,
        }))),
        None => Err(crate::errors::AppError::NotFound),
    }
}

pub async fn change_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    let auth_header = headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .ok_or(crate::errors::AppError::Unauthorized)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(crate::errors::AppError::Unauthorized)?;

    let secret = std::env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;
    let token_data = decode::<crate::services::auth_service::Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(jsonwebtoken::Algorithm::HS256),
    )
    .map_err(|_| crate::errors::AppError::Unauthorized)?;

    if token_data.claims.status != "active" {
        return Err(crate::errors::AppError::Forbidden);
    }

    let user_service = UserService::new(state.user_repo);
    user_service
        .change_password(
            &token_data.claims.sub,
            &req.current_password,
            &req.new_password,
            &req.confirm_password,
        )
        .await?;

    Ok(Json(json!({
        "message": "Password updated successfully. Please sign in again."
    })))
}

pub async fn approve_user(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    let user_service = UserService::new(state.user_repo);
    user_service.approve_user(&user_id).await?;
    
    Ok(Json(json!({
        "message": "User approved successfully",
        "user_id": user_id,
    })))
}

pub async fn reject_user(
    State(state): State<AppState>,
    Path(user_id): Path<String>,
) -> Result<Json<serde_json::Value>, crate::errors::AppError> {
    let user_service = UserService::new(state.user_repo);
    user_service.reject_user(&user_id).await?;
    
    Ok(Json(json!({
        "message": "User rejected successfully",
        "user_id": user_id,
    })))
}

pub async fn list_users(
    State(state): State<AppState>,
) -> Result<Json<Vec<UserResponse>>, crate::errors::AppError> {
    let user_service = UserService::new(state.user_repo);
    let users = user_service.list_users().await?;
    
    Ok(Json(users))
}
