use std::sync::Arc;
use std::net::SocketAddr;
use std::env;
use tokio::net::TcpListener;
use axum::{routing::get, Router};
use tower_http::limit::RequestBodyLimitLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use agnicore::{db, routes, repository, state::AppState};
use agnicore::repository::user_repository::UserRepository;
use agnicore::services::user_service::UserService;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "agnicore=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize PostgreSQL Database
    let pool = db::connection::connect_db().await?;
    
    // Create tables if they don't exist
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS logs (
            id VARCHAR(36) PRIMARY KEY,
            user VARCHAR(255) NOT NULL,
            resource VARCHAR(255) NOT NULL,
            risk_score INTEGER NOT NULL,
            decision VARCHAR(10) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )"
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )"
    )
    .execute(&pool)
    .await?;
    
    // Create repositories (using single PostgreSQL pool)
    let log_repo = Arc::new(repository::log_repository::PgLogRepository::new(pool.clone()));
    let user_repo = Arc::new(repository::user_repository::PgUserRepository::new(pool.clone()));
    
    // Auto-create first admin if no users exist
    let user_count = user_repo.count_users().await?;
    if user_count == 0 {
        tracing::info!("No users found. Creating first admin user...");
        let admin_username = env::var("ADMIN_USERNAME").unwrap_or_else(|_| "admin".to_string());
        let admin_password = env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin123!".to_string());
        
        let user_service = UserService::new(user_repo.clone());
        match user_service.create_admin(&admin_username, &admin_password).await {
            Ok(user) => tracing::info!("Admin user created: {}", user.username),
            Err(e) => tracing::error!("Failed to create admin user: {:?}", e),
        }
    }
    
    // Build app state
    let app_state = AppState::new(log_repo, user_repo);
    
    // CORS - Allow all origins for now (update for production)
    let allowed_origins = env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "*".to_string());
    
    let origins: Vec<&str> = allowed_origins.split(',').collect();
    let cors = tower_http::cors::CorsLayer::new()
        .allow_origin(origins.iter().map(|origin| {
            if *origin == "*" {
                axum::http::HeaderValue::from_static("*")
            } else {
                origin.parse::<axum::http::HeaderValue>().expect("Invalid CORS origin")
            }
        }).collect::<Vec<_>>())
        .allow_methods([
            axum::http::Method::GET, 
            axum::http::Method::POST,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::HeaderName::from_static("content-type"),
            axum::http::HeaderName::from_static("authorization"),
        ])
        .max_age(std::time::Duration::from_secs(3600));

    // Security headers middleware
    let security_headers = tower_http::set_header::SetResponseHeaderLayer::if_not_present(
        axum::http::header::X_CONTENT_TYPE_OPTIONS,
        axum::http::HeaderValue::from_static("nosniff"),
    );

    // Request body size limit (1MB max)
    let body_limit = RequestBodyLimitLayer::new(1024 * 1024);

    let app = Router::new()
        .route("/", get(root))
        .nest("/api", routes::create_routes())
        .with_state(app_state)
        .layer(body_limit)
        .layer(security_headers)
        .layer(cors);

    // Bind server
    let port = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "Agnicore running"
}
