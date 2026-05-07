use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng}
};

pub struct PasswordService;

impl PasswordService {
    pub fn new() -> Self {
        Self
    }
    
    /// Hash a password using Argon2id
    pub fn hash_password(&self, password: &str) -> Result<String, crate::errors::AppError> {
        let argon2 = Argon2::default();
        let salt = SaltString::generate(&mut OsRng);
        
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| {
                tracing::error!("Password hashing failed: {e}");
                crate::errors::AppError::InternalServerError
            })?;
        
        Ok(password_hash.to_string())
    }
    
    /// Verify a password against a hash using constant-time comparison
    pub fn verify_password(
        &self,
        password: &str,
        hash: &str,
    ) -> Result<bool, crate::errors::AppError> {
        let argon2 = Argon2::default();
        let parsed_hash = PasswordHash::new(hash).map_err(|e| {
            tracing::error!("Invalid password hash format: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        
        match argon2.verify_password(password.as_bytes(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(argon2::password_hash::Error::Password) => Ok(false),
            Err(e) => {
                tracing::error!("Password verification error: {e}");
                Err(crate::errors::AppError::InternalServerError)
            }
        }
    }
    
    /// Validate password strength
    pub fn validate_password_strength(password: &str) -> Result<(), crate::errors::AppError> {
        if password.len() < 8 {
            return Err(crate::errors::AppError::BadRequest(
                "Password must be at least 8 characters long".to_string()
            ));
        }
        
        let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
        let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
        let has_digit = password.chars().any(|c| c.is_ascii_digit());
        let has_special = password.chars().any(|c| !c.is_ascii_alphanumeric());
        
        if !has_uppercase || !has_lowercase || !has_digit || !has_special {
            return Err(crate::errors::AppError::BadRequest(
                "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character".to_string()
            ));
        }
        
        Ok(())
    }
}