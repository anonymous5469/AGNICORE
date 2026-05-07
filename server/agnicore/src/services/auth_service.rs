use async_trait::async_trait;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub role: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role: String,
    pub status: String,
    pub exp: usize,
}

#[async_trait]
pub trait AuthService: Send + Sync {
    async fn authenticate(&self, token: &str) -> Result<User, crate::errors::AppError>;
    async fn validate_token(&self, token: &str) -> Result<bool, crate::errors::AppError>;
}

pub struct DefaultAuthService;

#[async_trait]
impl AuthService for DefaultAuthService {
    async fn authenticate(&self, token: &str) -> Result<User, crate::errors::AppError> {
        let secret = env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|_| crate::errors::AppError::Unauthorized)?;

        // Check if user status is active
        if token_data.claims.status != "active" {
            return Err(crate::errors::AppError::Forbidden);
        }

        Ok(User {
            id: Uuid::parse_str(&token_data.claims.sub).map_err(|_| crate::errors::AppError::Unauthorized)?,
            username: token_data.claims.username,
            role: token_data.claims.role,
            status: token_data.claims.status,
        })
    }

    async fn validate_token(&self, token: &str) -> Result<bool, crate::errors::AppError> {
        let secret = env::var("JWT_SECRET").map_err(|_| crate::errors::AppError::InternalServerError)?;
        Ok(
            decode::<Claims>(
                token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &Validation::new(Algorithm::HS256),
            )
            .is_ok(),
        )
    }
}