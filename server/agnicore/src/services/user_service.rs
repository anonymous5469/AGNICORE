use crate::domain::user_models::{User, UserResponse};
use crate::repository::user_repository::UserRepository;
use crate::services::password_service::PasswordService;
use std::sync::Arc;

pub struct UserService {
    user_repo: Arc<dyn UserRepository>,
    password_service: PasswordService,
}

impl UserService {
    pub fn new(user_repo: Arc<dyn UserRepository>) -> Self {
        Self {
            user_repo,
            password_service: PasswordService::new(),
        }
    }
    
    pub async fn register_user(
        &self,
        username: &str,
        password: &str,
    ) -> Result<User, crate::errors::AppError> {
        // Validate username
        Self::validate_username(username)?;
        
        // Validate password strength
        PasswordService::validate_password_strength(password)?;
        
        // Hash password
        let password_hash = self.password_service.hash_password(password)?;
        
        // Create user with pending status
        let user = self.user_repo.create_user(
            username,
            &password_hash,
            "user",
            "pending",
        ).await?;
        
        Ok(user)
    }
    
    pub async fn create_admin(
        &self,
        username: &str,
        password: &str,
    ) -> Result<User, crate::errors::AppError> {
        let password_hash = self.password_service.hash_password(password)?;
        
        let user = self.user_repo.create_user(
            username,
            &password_hash,
            "admin",
            "active",
        ).await?;
        
        Ok(user)
    }

    pub async fn ensure_admin(
        &self,
        username: &str,
        password: &str,
    ) -> Result<User, crate::errors::AppError> {
        let password_hash = self.password_service.hash_password(password)?;

        if let Some(mut user) = self.user_repo.find_by_username(username).await? {
            self.user_repo
                .update_password_role_status(username, &password_hash, "admin", "active")
                .await?;

            user.password_hash = password_hash;
            user.role = "admin".to_string();
            user.status = "active".to_string();
            return Ok(user);
        }

        self.user_repo
            .create_user(username, &password_hash, "admin", "active")
            .await
    }
    
    pub async fn authenticate_user(
        &self,
        username: &str,
        password: &str,
    ) -> Result<Option<User>, crate::errors::AppError> {
        let user = self.user_repo.find_by_username(username).await?;
        
        if let Some(ref user) = user {
            let valid = self.password_service.verify_password(password, &user.password_hash)?;
            if !valid {
                return Ok(None);
            }
        }
        
        Ok(user)
    }
    
    pub async fn approve_user(
        &self,
        user_id: &str,
    ) -> Result<(), crate::errors::AppError> {
        self.user_repo.update_status(user_id, "active").await
    }
    
    pub async fn reject_user(
        &self,
        user_id: &str,
    ) -> Result<(), crate::errors::AppError> {
        self.user_repo.update_status(user_id, "rejected").await
    }
    
    pub async fn list_users(
        &self,
    ) -> Result<Vec<UserResponse>, crate::errors::AppError> {
        self.user_repo.list_users().await
    }
    
    pub async fn count_users(&self) -> Result<i64, crate::errors::AppError> {
        self.user_repo.count_users().await
    }
    
    fn validate_username(username: &str) -> Result<(), crate::errors::AppError> {
        if username.len() < 3 || username.len() > 32 {
            return Err(crate::errors::AppError::BadRequest(
                "Username must be between 3 and 32 characters".to_string()
            ));
        }
        
        if !username.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
            return Err(crate::errors::AppError::BadRequest(
                "Username can only contain letters, numbers, underscores, and hyphens".to_string()
            ));
        }
        
        Ok(())
    }
}
