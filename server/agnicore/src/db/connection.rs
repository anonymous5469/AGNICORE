use sqlx::{Pool, Postgres};
use std::env;

pub type DbPool = Pool<Postgres>;

pub async fn connect_db() -> Result<DbPool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    // Check if URL is for PostgreSQL or SQLite
    if database_url.starts_with("postgres") {
        Pool::connect(&database_url).await
    } else {
        panic!("PostgreSQL URL required. Found: {}", database_url);
    }
}
