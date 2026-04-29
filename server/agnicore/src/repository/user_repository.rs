use async_trait::async_trait;
use sqlx::PgPool;
use crate::domain::user_models::{User, UserResponse};
use chrono::Utc;
use uuid::Uuid;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create_user(
        &self,
        username: &str,
        password_hash: &str,
        role: &str,
        status: &str,
    ) -> Result<User, crate::errors::AppError>;
    
    async fn find_by_username(
        &self,
        username: &str,
    ) -> Result<Option<User>, crate::errors::AppError>;
    
    async fn find_by_id(
        &self,
        id: &str,
    ) -> Result<Option<User>, crate::errors::AppError>;
    
    async fn update_status(
        &self,
        id: &str,
        status: &str,
    ) -> Result<(), crate::errors::AppError>;

    async fn update_password_role_status(
        &self,
        username: &str,
        password_hash: &str,
        role: &str,
        status: &str,
    ) -> Result<(), crate::errors::AppError>;

    async fn update_password_by_id(
        &self,
        id: &str,
        password_hash: &str,
    ) -> Result<(), crate::errors::AppError>;
    
    async fn list_users(
        &self,
    ) -> Result<Vec<UserResponse>, crate::errors::AppError>;
    
    async fn count_users(&self,
    ) -> Result<i64, crate::errors::AppError>;
}

pub struct PgUserRepository {
    pool: PgPool,
}

impl PgUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for PgUserRepository {
    async fn create_user(
        &self,
        username: &str,
        password_hash: &str,
        role: &str,
        status: &str,
    ) -> Result<User, crate::errors::AppError> {
        let now = Utc::now();
        let user = User {
            id: Uuid::new_v4().to_string(),
            username: username.to_string(),
            password_hash: password_hash.to_string(),
            role: role.to_string(),
            status: status.to_string(),
            created_at: now,
            updated_at: now,
        };
        
        sqlx::query(
            "INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(&user.id)
        .bind(&user.username)
        .bind(&user.password_hash)
        .bind(&user.role)
        .bind(&user.status)
        .bind(&user.created_at)
        .bind(&user.updated_at)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error creating user: {e}");
            if e.to_string().contains("duplicate key") {
                crate::errors::AppError::BadRequest("Username already exists".to_string())
            } else {
                crate::errors::AppError::InternalServerError
            }
        })?;
        
        Ok(user)
    }
    
    async fn find_by_username(
        &self,
        username: &str,
    ) -> Result<Option<User>, crate::errors::AppError> {
        let user = sqlx::query_as::<_, User>(
            "SELECT id, username, password_hash, role, status, created_at, updated_at 
             FROM users WHERE username = $1"
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error finding user: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        
        Ok(user)
    }
    
    async fn find_by_id(
        &self,
        id: &str,
    ) -> Result<Option<User>, crate::errors::AppError> {
        let user = sqlx::query_as::<_, User>(
            "SELECT id, username, password_hash, role, status, created_at, updated_at 
             FROM users WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error finding user by id: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        
        Ok(user)
    }
    
    async fn update_status(
        &self,
        id: &str,
        status: &str,
    ) -> Result<(), crate::errors::AppError> {
        let now = Utc::now();
        sqlx::query(
            "UPDATE users SET status = $1, updated_at = $2 WHERE id = $3"
        )
        .bind(status)
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error updating user status: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        
        Ok(())
    }

    async fn update_password_role_status(
        &self,
        username: &str,
        password_hash: &str,
        role: &str,
        status: &str,
    ) -> Result<(), crate::errors::AppError> {
        let now = Utc::now();
        sqlx::query(
            "UPDATE users SET password_hash = $1, role = $2, status = $3, updated_at = $4 WHERE username = $5"
        )
        .bind(password_hash)
        .bind(role)
        .bind(status)
        .bind(now)
        .bind(username)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error updating user password/role/status: {e}");
            crate::errors::AppError::InternalServerError
        })?;

        Ok(())
    }

    async fn update_password_by_id(
        &self,
        id: &str,
        password_hash: &str,
    ) -> Result<(), crate::errors::AppError> {
        let now = Utc::now();
        sqlx::query(
            "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3"
        )
        .bind(password_hash)
        .bind(now)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error updating user password: {e}");
            crate::errors::AppError::InternalServerError
        })?;

        Ok(())
    }
    
    async fn list_users(
        &self,
    ) -> Result<Vec<UserResponse>, crate::errors::AppError> {
        let users = sqlx::query_as::<_, UserResponse>(
            "SELECT id, username, role, status, created_at 
             FROM users ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error listing users: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        
        Ok(users)
    }
    
    async fn count_users(&self,
    ) -> Result<i64, crate::errors::AppError> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM users"
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error counting users: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        
        Ok(count)
    }
}
