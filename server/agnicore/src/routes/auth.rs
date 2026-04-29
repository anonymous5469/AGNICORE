use axum::{routing::{get, post}, Router};
use crate::handlers::auth_handler;
use crate::state::AppState;

pub fn create_route() -> Router<AppState> {
    Router::new()
        .route("/register", post(auth_handler::register))
        .route("/login", post(auth_handler::login))
        .route("/me", post(auth_handler::me))
        .route("/change-password", post(auth_handler::change_password))
        .route("/users", get(auth_handler::list_users))
        .route("/approve/{user_id}", post(auth_handler::approve_user))
        .route("/reject/{user_id}", post(auth_handler::reject_user))
}
