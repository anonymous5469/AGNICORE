pub mod access;
pub mod auth;
pub mod health;
pub mod mfa;

use axum::Router;
use axum::routing::get;
use crate::handlers::analytics_handler;
use crate::state::AppState;

pub fn create_routes() -> Router<AppState> {
    Router::new()
        .nest("/access", access::create_route())
        .nest("/auth", auth::create_route())
        .nest("/health", health::create_route())
        .nest("/mfa", mfa::create_route())
        .route("/analytics", get(analytics_handler::get_analytics))
}