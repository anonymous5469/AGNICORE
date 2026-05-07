use axum::{routing::get, Json, Router};
use serde_json::json;
use crate::state::AppState;

pub fn create_route() -> Router<AppState> {
    Router::new().route("/", get(health_check))
}

async fn health_check() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok", "service": "agnicore" }))
}