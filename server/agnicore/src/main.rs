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
    
    // Create tables if they don't exist (with new schema)
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS logs (
            id VARCHAR(36) PRIMARY KEY,
            \"user\" VARCHAR(255) NOT NULL,
            resource VARCHAR(255) NOT NULL,
            action VARCHAR(50) NOT NULL DEFAULT 'read',
            ip VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
            device VARCHAR(100),
            location VARCHAR(50) NOT NULL DEFAULT 'Unknown',
            risk_score INTEGER NOT NULL,
            decision VARCHAR(10) NOT NULL,
            reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )"
    )
    .execute(&pool)
    .await?;

    // Run migrations for existing tables (add new columns if they don't exist)
    tracing::info!("Running database migrations...");
    
    // Add action column if missing
    let _ = sqlx::query(
        "ALTER TABLE logs ADD COLUMN IF NOT EXISTS action VARCHAR(50) NOT NULL DEFAULT 'read'"
    )
    .execute(&pool)
    .await;

    // Add ip column if missing
    let _ = sqlx::query(
        "ALTER TABLE logs ADD COLUMN IF NOT EXISTS ip VARCHAR(45) NOT NULL DEFAULT '127.0.0.1'"
    )
    .execute(&pool)
    .await;

    // Add device column if missing
    let _ = sqlx::query(
        "ALTER TABLE logs ADD COLUMN IF NOT EXISTS device VARCHAR(100)"
    )
    .execute(&pool)
    .await;

    // Add location column if missing
    let _ = sqlx::query(
        "ALTER TABLE logs ADD COLUMN IF NOT EXISTS location VARCHAR(50) NOT NULL DEFAULT 'Unknown'"
    )
    .execute(&pool)
    .await;

    // Add reason column if missing
    let _ = sqlx::query(
        "ALTER TABLE logs ADD COLUMN IF NOT EXISTS reason TEXT"
    )
    .execute(&pool)
    .await;

    tracing::info!("Database migrations completed successfully");

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
    
    // Create the first admin only once. Password changes are self-service after that.
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

    // Smart data seeding/fixing
    let log_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM logs")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);
    
    if log_count == 0 {
        // Database is empty - insert sample data
        tracing::info!("No logs found. Seeding sample data...");
        seed_sample_data(&pool).await;
        tracing::info!("Sample data seeded successfully");
    } else {
        // Fix old records with null fields
        tracing::info!("Checking for incomplete records...");
        
        // Count incomplete records before fixing
        let incomplete_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM logs 
             WHERE device IS NULL OR location IS NULL OR reason IS NULL OR action IS NULL"
        )
        .fetch_one(&pool)
        .await
        .unwrap_or(0);
        
        if incomplete_count > 0 {
            tracing::info!("Found {} incomplete records. Fixing...", incomplete_count);
            
            // Update incomplete records with reasonable defaults
            let _ = sqlx::query(
                "UPDATE logs 
                 SET device = COALESCE(device, 'Unknown Device'),
                     location = COALESCE(location, 'Unknown'),
                     reason = COALESCE(reason, CASE 
                         WHEN decision = 'DENY' THEN 'High risk access denied'
                         WHEN decision = 'VERIFY' THEN 'Medium risk - verification required'
                         ELSE 'Low risk access'
                     END),
                     action = COALESCE(action, 'read')
                 WHERE device IS NULL OR location IS NULL OR reason IS NULL OR action IS NULL"
            )
            .execute(&pool)
            .await;
            
            tracing::info!("Fixed {} incomplete records", incomplete_count);
        }
        
        // Ensure we have at least 10 records for a good demo
        if log_count < 10 {
            tracing::info!("Only {} records found. Adding more sample data...", log_count);
            seed_sample_data(&pool).await;
            tracing::info!("Additional sample data added");
        } else {
            tracing::info!("Database has {} records", log_count);
        }
    }

    // Start background data generator
    let enable_generator = env::var("ENABLE_DATA_GENERATION")
        .unwrap_or_else(|_| "true".to_string())
        == "true";
    
    if enable_generator {
        tracing::info!("Starting background data generator...");
        let generator_pool = pool.clone();
        tokio::spawn(async move {
            let generator = agnicore::services::data_generator::DataGenerator::new(generator_pool);
            generator.start_background().await;
        });
    } else {
        tracing::info!("Background data generator disabled");
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

async fn seed_sample_data(pool: &sqlx::PgPool) {
    use chrono::Utc;
    use uuid::Uuid;
    
    let sample_logs = vec![
        ("admin", "finance/reports", "read", "192.168.1.4", "Linux Workstation", "Trusted", 12, "ALLOW", "Normal business hours access from trusted location"),
        ("john.doe", "engineering/ci", "write", "10.0.0.15", "Windows Laptop", "External", 45, "VERIFY", "Write action from external network, requires verification"),
        ("attacker", "admin/root", "write", "203.45.67.89", "Unknown Device", "Unknown", 89, "DENY", "Suspicious access attempt to admin resources from unknown location"),
        ("jane.smith", "sales/portal", "read", "192.168.1.10", "iPhone", "Trusted", 28, "ALLOW", "Standard access during work hours"),
        ("bob.wilson", "ops/observability", "read", "172.16.0.5", "Linux Server", "Trusted", 15, "ALLOW", "Automated monitoring system access"),
        ("threat.actor", "admin/secrets", "read", "185.220.101.45", "Kali Linux", "Unknown", 92, "DENY", "Multiple failed attempts from anonymized endpoint"),
        ("remote.dev", "engineering/git", "write", "10.0.0.22", "MacBook Pro", "External", 38, "VERIFY", "Developer VPN access during off-hours"),
        ("service.bot", "api/v1/health", "read", "127.0.0.1", "Docker Container", "Trusted", 5, "ALLOW", "Internal health check probe"),
        ("guest.user", "public/docs", "read", "8.8.8.8", "Chrome Browser", "External", 20, "ALLOW", "Public documentation access"),
        ("security.scan", "network/edge", "read", "192.168.1.100", "Security Appliance", "Trusted", 35, "VERIFY", "Security scan requires approval"),
    ];

    for (user, resource, action, ip, device, location, risk_score, decision, reason) in sample_logs {
        let _ = sqlx::query(
            "INSERT INTO logs (id, \"user\", resource, action, ip, device, location, risk_score, decision, reason, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
        )
        .bind(Uuid::new_v4().to_string())
        .bind(user)
        .bind(resource)
        .bind(action)
        .bind(ip)
        .bind(device)
        .bind(location)
        .bind(risk_score)
        .bind(decision)
        .bind(reason)
        .bind(Utc::now() - chrono::Duration::hours(rand::random::<i64>() % 48))
        .execute(pool)
        .await;
    }
}

async fn root() -> &'static str {
    "Agnicore running"
}
