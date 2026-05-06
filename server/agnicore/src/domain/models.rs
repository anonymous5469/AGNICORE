use serde::{Deserialize, Serialize};
use sqlx::types::chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessRequest {
    pub user_id: Uuid,
    pub resource: String,
    pub action: String,
    pub ip: Option<String>,
    pub request_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessDecision {
    pub allowed: bool,
    pub decision: String,      
    pub risk_score: i32,
    pub reason: String,
    pub mfa_required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LogEntry {
    pub id: String,
    #[sqlx(rename = "user")]
    pub user: String,
    pub resource: String,
    pub action: String,
    pub ip: String,
    pub device: Option<String>,
    pub location: String,
    pub risk_score: i32,
    pub decision: String,
    pub reason: Option<String>,
    pub created_at: DateTime<Utc>,
}
