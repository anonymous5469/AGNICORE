use async_trait::async_trait;
use crate::domain::AccessRequest;

#[async_trait]
pub trait ContextService: Send + Sync {
    async fn enrich_context(&self, request: &mut AccessRequest) -> Result<(), crate::errors::AppError>;
}

pub struct DefaultContextService;

#[async_trait]
impl ContextService for DefaultContextService {
    async fn enrich_context(&self, _request: &mut AccessRequest) -> Result<(), crate::errors::AppError> {
        // TODO: Implement context enrichment (user roles, permissions, etc.)
        Ok(())
    }
}