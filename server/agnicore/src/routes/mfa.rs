use axum::{routing::post, Router};
use crate::handlers::mfa_handler;
use crate::state::AppState;

pub fn create_route() -> Router<AppState> {
    Router::new()
        .route("/setup", post(mfa_handler::setup_mfa))
        .route("/verify", post(mfa_handler::verify_mfa))
}