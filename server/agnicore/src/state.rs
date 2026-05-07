use std::sync::Arc;
use crate::repository::log_repository::LogRepository;
use crate::repository::user_repository::UserRepository;

#[derive(Clone)]
pub struct AppState {
    pub log_repo: Arc<dyn LogRepository>,
    pub user_repo: Arc<dyn UserRepository>,
}

impl AppState {
    pub fn new(
        log_repo: Arc<dyn LogRepository>,
        user_repo: Arc<dyn UserRepository>,
    ) -> Self {
        Self {
            log_repo,
            user_repo,
        }
    }
}