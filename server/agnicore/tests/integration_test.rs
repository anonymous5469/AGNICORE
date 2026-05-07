use axum::body::Body;
use axum::http::{Request, StatusCode};
use serde_json::json;
use std::sync::Arc;
use std::sync::Mutex;
use tower::ServiceExt;

use agnicore::repository::log_repository::SqliteLogRepository;
use agnicore::repository::user_repository::SqliteUserRepository;
use agnicore::routes::create_routes;
use agnicore::state::AppState;

// Static lock to prevent env var races between tests
static ENV_LOCK: Mutex<()> = Mutex::new(());

async fn create_test_app() -> axum::Router {
    // Set default env vars for testing
    std::env::set_var("JWT_SECRET", "test_secret_key_that_is_at_least_32_chars_long");
    std::env::set_var("TOKEN_ISSUER_ADMIN_SECRET", "test_admin_secret");

    let database_url = "sqlite::memory:";
    let pool = sqlx::SqlitePool::connect(database_url)
        .await
        .expect("Failed to create test pool");
    
    // Initialize schema
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            user TEXT NOT NULL,
            resource TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            decision TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    )
    .execute(&pool)
    .await
    .expect("Failed to create logs table");

    let users_pool = sqlx::SqlitePool::connect("sqlite::memory:")
        .await
        .expect("Failed to create users test pool");
    
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )"
    )
    .execute(&users_pool)
    .await
    .expect("Failed to create users table");

    let repo = Arc::new(SqliteLogRepository::new(pool));
    let user_repo = Arc::new(SqliteUserRepository::new(users_pool));
    let state = AppState::new(repo, user_repo);
    
    axum::Router::new()
        .nest("/api", create_routes())
        .with_state(state)
}

#[tokio::test]
async fn test_health_check() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/health").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_auth_register() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/register")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "username": "testuser",
                        "password": "TestPassword123!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_auth_register_duplicate() {
    let app = create_test_app().await;

    // First registration
    let _ = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/register")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "username": "testuser",
                        "password": "TestPassword123!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await;

    // Second registration with same username
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/register")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "username": "testuser",
                        "password": "TestPassword123!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_auth_login_pending() {
    let app = create_test_app().await;

    // Register a user
    let _ = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/register")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "username": "testuser",
                        "password": "TestPassword123!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await;

    // Try to login (should fail because status is pending)
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/login")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "username": "testuser",
                        "password": "TestPassword123!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_auth_login_invalid() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/login")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "username": "nonexistent",
                        "password": "wrongpassword"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_mfa_setup() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/mfa/setup")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_logs_empty() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/access/logs").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_metrics_empty() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/access/metrics").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_analytics_empty() {
    let app = create_test_app().await;

    let response = app
        .oneshot(Request::builder().uri("/api/analytics").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_validate_token_endpoint() {
    std::env::set_var("ENABLE_DEV_TOKEN_ISSUER", "true");
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/access/validate")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "token": "invalid.token.here"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}