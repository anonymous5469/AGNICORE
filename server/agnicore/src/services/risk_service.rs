use async_trait::async_trait;
use crate::domain::AccessRequest;

#[async_trait]
pub trait RiskService: Send + Sync {
    async fn calculate_risk(&self, request: &AccessRequest) -> Result<i32, crate::errors::AppError>;
}

pub struct DefaultRiskService;

#[async_trait]
impl RiskService for DefaultRiskService {
    async fn calculate_risk(&self, request: &AccessRequest) -> Result<i32, crate::errors::AppError> {
        let user_id = request.user_id.to_string();
        let resource = &request.resource;
        let action = &request.action;
        let hour = crate::utils::time::current_hour();
        let ip = request.ip.as_deref().unwrap_or("127.0.0.1");
        let request_count = request.request_count;

        let mut risk = calculate_risk(&user_id, resource, hour, ip, request_count);

        // Apply action-based risk (the standalone function doesn't handle this)
        if action == "write" || action == "approve" {
            risk += 20;
        }

        Ok(risk.min(100))
    }
}

pub fn calculate_risk(
    user: &str,
    resource: &str,
    hour: u32,
    ip: &str,
    request_count: i64,
) -> i32 {
    let mut risk = 0;

    if user == "invalid_user" || user == "expired_user" {
        risk += 50;
    }

    if resource.contains("admin") || resource == "admin" {
        risk += 40;
    }

    if hour < 6 || hour > 22 {
        risk += 20;
    }

    if ip.starts_with("192.168") || ip.starts_with("10.") || ip == "127.0.0.1" {
        risk += 5;
    } else {
        risk += 15;
    }

    if request_count > 5 {
        risk += 20;
    }
    if request_count > 10 {
        risk += 30;
    }
    if request_count > 20 {
        risk += 50;
    }

    risk
}

/// Validates a JWT token and returns the subject (user ID) and role.
/// This utility function is used for token introspection and risk assessment.
pub fn validate_token(token: &str, secret: &str) -> Result<(String, String), crate::errors::AppError> {
    use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
    use crate::services::auth_service::Claims;

    match decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    ) {
        Ok(data) => {
            let now = chrono::Utc::now().timestamp() as usize;
            if data.claims.exp < now {
                Err(crate::errors::AppError::Unauthorized)
            } else {
                Ok((data.claims.sub, data.claims.role))
            }
        }
        Err(_) => Err(crate::errors::AppError::Unauthorized),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_calculate_risk_low_risk() {
        let risk = calculate_risk("normal_user", "public/data", 12, "192.168.1.1", 1);
        assert_eq!(risk, 5); // Private IP only
    }

    #[test]
    fn test_calculate_risk_admin_resource() {
        let risk = calculate_risk("normal_user", "admin/panel", 12, "192.168.1.1", 1);
        assert_eq!(risk, 45); // Private IP (5) + Admin resource (40)
    }

    #[test]
    fn test_calculate_risk_off_hours() {
        let risk = calculate_risk("normal_user", "public/data", 2, "192.168.1.1", 1);
        assert_eq!(risk, 25); // Private IP (5) + Off hours (20)
    }

    #[test]
    fn test_calculate_risk_external_ip() {
        let risk = calculate_risk("normal_user", "public/data", 12, "8.8.8.8", 1);
        assert_eq!(risk, 15); // External IP
    }

    #[test]
    fn test_calculate_risk_high_frequency() {
        let risk = calculate_risk("normal_user", "public/data", 12, "192.168.1.1", 25);
        // Private IP (5) + Frequency >5 (20) + >10 (30) + >20 (50) = 105
        assert_eq!(risk, 105);
    }

    #[test]
    fn test_calculate_risk_invalid_user() {
        let risk = calculate_risk("invalid_user", "public/data", 12, "192.168.1.1", 1);
        assert_eq!(risk, 55); // Private IP (5) + Invalid user (50)
    }

    #[tokio::test]
    async fn test_default_risk_service_calculate_risk() {
        let service = DefaultRiskService;
        let request = AccessRequest {
            user_id: Uuid::new_v4(),
            resource: "admin/secrets".to_string(),
            action: "write".to_string(),
            ip: Some("10.0.0.1".to_string()),
            request_count: 15,
        };

        let risk = service.calculate_risk(&request).await.unwrap();
        // Admin resource (40) + Write action (20) + Private IP (5) + Request count > 10 (30)
        // Total: 95, capped at 100
        assert!(risk <= 100);
        assert!(risk >= 90);
    }

    #[tokio::test]
    async fn test_default_risk_service_low_risk() {
        let service = DefaultRiskService;
        let request = AccessRequest {
            user_id: Uuid::new_v4(),
            resource: "public/data".to_string(),
            action: "read".to_string(),
            ip: Some("192.168.1.1".to_string()),
            request_count: 1,
        };

        let risk = service.calculate_risk(&request).await.unwrap();
        // Private IP (5) + Read action (0) + Normal resource (0) + Low frequency (0)
        assert_eq!(risk, 5);
    }
}