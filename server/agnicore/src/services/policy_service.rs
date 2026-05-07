use async_trait::async_trait;

use crate::domain::{AccessRequest, AccessDecision};
use crate::errors::app_error::AppError;

#[async_trait]
pub trait PolicyService: Send + Sync {
    async fn evaluate_policy(
        &self,
        request: &AccessRequest,
        risk_score: i32,
    ) -> Result<AccessDecision, AppError>;
}

pub struct DefaultPolicyService;

#[async_trait]
impl PolicyService for DefaultPolicyService {
    async fn evaluate_policy(
        &self,
        request: &AccessRequest,
        risk_score: i32,
    ) -> Result<AccessDecision, AppError> {
        // 🔥 STEP 1 — Admin resource requires special scrutiny
        if request.resource.contains("admin") && risk_score > 40 {
            return Ok(AccessDecision {
                allowed: false,
                decision: "DENY".to_string(),
                risk_score,
                reason: "Admin access restricted at elevated risk level".to_string(),
                mfa_required: true,
            });
        }

        // 🔥 STEP 2 — Risk-based decision (core logic)
        let (decision, allowed, mfa_required, reason) = if risk_score < 30 {
            (
                "ALLOW",
                true,
                false,
                "Low risk access",
            )
        } else if risk_score < 60 {
            (
                "VERIFY",
                false,
                true,
                "Medium risk - verification required",
            )
        } else {
            (
                "DENY",
                false,
                false,
                "High risk access denied",
            )
        };

        // 🔥 STEP 3 — Return final decision
        Ok(AccessDecision {
            allowed,
            decision: decision.to_string(),
            risk_score,
            reason: reason.to_string(),
            mfa_required,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn create_test_request(resource: &str) -> AccessRequest {
        AccessRequest {
            user_id: Uuid::new_v4(),
            resource: resource.to_string(),
            action: "read".to_string(),
            ip: None,
            request_count: 0,
        }
    }

    #[tokio::test]
    async fn test_allow_low_risk() {
        let service = DefaultPolicyService;
        let request = create_test_request("public/data");
        let result = service.evaluate_policy(&request, 15).await.unwrap();
        
        assert_eq!(result.decision, "ALLOW");
        assert!(result.allowed);
        assert!(!result.mfa_required);
    }

    #[tokio::test]
    async fn test_verify_medium_risk() {
        let service = DefaultPolicyService;
        let request = create_test_request("public/data");
        let result = service.evaluate_policy(&request, 45).await.unwrap();
        
        assert_eq!(result.decision, "VERIFY");
        assert!(!result.allowed);
        assert!(result.mfa_required);
    }

    #[tokio::test]
    async fn test_deny_high_risk() {
        let service = DefaultPolicyService;
        let request = create_test_request("public/data");
        let result = service.evaluate_policy(&request, 75).await.unwrap();
        
        assert_eq!(result.decision, "DENY");
        assert!(!result.allowed);
        assert!(!result.mfa_required);
    }

    #[tokio::test]
    async fn test_admin_high_risk_special_case() {
        let service = DefaultPolicyService;
        let request = create_test_request("admin/panel");
        let result = service.evaluate_policy(&request, 50).await.unwrap();
        
        assert_eq!(result.decision, "DENY");
        assert!(!result.allowed);
        assert!(result.mfa_required);
        assert_eq!(result.reason, "Admin access restricted at elevated risk level");
    }

    #[tokio::test]
    async fn test_admin_low_risk() {
        let service = DefaultPolicyService;
        let request = create_test_request("admin/panel");
        let result = service.evaluate_policy(&request, 25).await.unwrap();
        
        assert_eq!(result.decision, "ALLOW");
        assert!(result.allowed);
    }
}