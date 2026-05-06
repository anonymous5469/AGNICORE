use async_trait::async_trait;
use sqlx::PgPool;
use crate::domain::models::LogEntry;
use chrono::Utc;
use uuid::Uuid;

#[async_trait]
pub trait LogRepository: Send + Sync {
    async fn log_access(
        &self,
        user: &str,
        resource: &str,
        action: &str,
        ip: &str,
        device: Option<&str>,
        location: &str,
        risk: i32,
        decision: &str,
        reason: Option<&str>,
    ) -> Result<(), crate::errors::AppError>;
    async fn get_recent_logs(&self, limit: i64
    ) -> Result<Vec<LogEntry>, crate::errors::AppError>;
    async fn count_recent_requests(
        &self,
        user: &str,
        minutes: i64,
    ) -> Result<i64, crate::errors::AppError>;
}

pub struct PgLogRepository {
    pool: PgPool,
}

impl PgLogRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl LogRepository for PgLogRepository {
    async fn log_access(
        &self,
        user: &str,
        resource: &str,
        action: &str,
        ip: &str,
        device: Option<&str>,
        location: &str,
        risk: i32,
        decision: &str,
        reason: Option<&str>,
    ) -> Result<(), crate::errors::AppError> {
        sqlx::query(
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
        .bind(risk)
        .bind(decision)
        .bind(reason)
        .bind(Utc::now())
        .execute(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error logging access: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        Ok(())
    }

    async fn get_recent_logs(&self, limit: i64
    ) -> Result<Vec<LogEntry>, crate::errors::AppError> {
        let logs = sqlx::query_as::<_, LogEntry>(
            "SELECT id, \"user\", resource, action, ip, device, location, risk_score, decision, reason, created_at 
             FROM logs ORDER BY created_at DESC LIMIT $1"
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error fetching logs: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        Ok(logs)
    }

    async fn count_recent_requests(
        &self,
        user: &str,
        minutes: i64,
    ) -> Result<i64, crate::errors::AppError> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM logs 
             WHERE \"user\" = $1 AND created_at > NOW() - INTERVAL '1 minute' * $2"
        )
        .bind(user)
        .bind(minutes)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            tracing::error!("Database error counting recent requests: {e}");
            crate::errors::AppError::InternalServerError
        })?;
        Ok(count)
    }
}
