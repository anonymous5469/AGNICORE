use axum::extract::Request;
use axum::middleware::Next;
use axum::response::Response;

pub async fn require_active(
    req: Request,
    next: Next,
) -> Result<Response, crate::errors::AppError> {
    // Extract token from Authorization header
    let auth_header = req.headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(crate::errors::AppError::Unauthorized)?;
    
    let token = auth_header.strip_prefix("Bearer ")
        .ok_or(crate::errors::AppError::Unauthorized)?;
    
    // Decode token to check status
    let secret = std::env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;
    let token_data = jsonwebtoken::decode::<crate::services::auth_service::Claims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256),
    )
    .map_err(|_| crate::errors::AppError::Unauthorized)?;
    
    if token_data.claims.status != "active" {
        return Err(crate::errors::AppError::Forbidden);
    }
    
    Ok(next.run(req).await)
}

pub async fn require_admin(
    req: Request,
    next: Next,
) -> Result<Response, crate::errors::AppError> {
    // Extract token from Authorization header
    let auth_header = req.headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(crate::errors::AppError::Unauthorized)?;
    
    let token = auth_header.strip_prefix("Bearer ")
        .ok_or(crate::errors::AppError::Unauthorized)?;
    
    // Decode token to check role
    let secret = std::env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;
    let token_data = jsonwebtoken::decode::<crate::services::auth_service::Claims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256),
    )
    .map_err(|_| crate::errors::AppError::Unauthorized)?;
    
    if token_data.claims.role != "admin" {
        return Err(crate::errors::AppError::Forbidden);
    }
    
    Ok(next.run(req).await)
}