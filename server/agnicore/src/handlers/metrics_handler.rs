use axum::extract::State;
use axum::Json;
use serde::Serialize;
use crate::state::AppState;

#[derive(Serialize)]
pub struct DashboardMetrics {
    pub risk_score: i32,
    pub requests_today: i64,
    pub blocked_requests: i64,
    pub verification_queue: i64,
    pub trust_coverage: String,
    pub threat_index: String,
    pub decision: String,
}

pub async fn handle_get_metrics(
    State(state): State<AppState>,
) -> Result<Json<DashboardMetrics>, crate::errors::AppError> {
    let logs = state.log_repo.get_recent_logs(100).await?;
    
    let total = logs.len() as i64;
    let blocked = logs.iter().filter(|l| l.decision == "DENY").count() as i64;
    let avg_risk = if total > 0 {
        logs.iter().map(|l| l.risk_score).sum::<i32>() / total as i32
    } else {
        0
    };
    let latest_decision = logs.first().map(|l| l.decision.clone()).unwrap_or_else(|| "ALLOW".to_string());

    Ok(Json(DashboardMetrics {
        risk_score: avg_risk,
        requests_today: total,
        blocked_requests: blocked,
        verification_queue: total / 10,
        trust_coverage: "94%".to_string(),
        threat_index: format!("{:+}%", if total > 0 { (blocked * 100) / total } else { 0 }),
        decision: latest_decision,
    }))
}