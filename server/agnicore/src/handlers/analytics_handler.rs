use axum::{extract::State, Json};
use serde_json::json;

use crate::errors::app_error::AppError;
use crate::state::AppState;

pub async fn get_analytics(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let logs = state.log_repo.get_recent_logs(100).await?;

    if logs.is_empty() {
        return Err(AppError::NotFound);
    }

    let total_requests = logs.len() as i64;
    let avg_risk: f64 = if total_requests > 0 {
        logs.iter().map(|l| l.risk_score as f64).sum::<f64>() / total_requests as f64
    } else {
        0.0
    };

    let denied_count = logs.iter().filter(|l| l.decision == "DENY").count() as i64;

    let mut user_risk_map: std::collections::HashMap<String, (i32, i64)> = std::collections::HashMap::new();
    for log in &logs {
        let entry = user_risk_map.entry(log.user.clone()).or_insert((0, 0));
        entry.0 = (entry.0 + log.risk_score).min(100);
        entry.1 += 1;
    }

    let mut risky_users: Vec<(String, i64)> = user_risk_map
        .into_iter()
        .filter(|(_, (risk, _))| *risk > 50)
        .map(|(user, (_, count))| (user, count))
        .collect();
    risky_users.sort_by(|a, b| b.1.cmp(&a.1));
    risky_users.truncate(5);

    Ok(Json(json!({
        "total_requests": total_requests,
        "average_risk": avg_risk,
        "denied_requests": denied_count,
        "top_risky_users": risky_users
    })))
}