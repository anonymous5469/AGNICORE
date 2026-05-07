use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::{Duration, Utc};
use rand::seq::SliceRandom;
use rand::Rng;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:agnicore.db".to_string());
    let pool = SqlitePool::connect(&database_url).await?;

    let users = [
        "admin", "john.doe", "attacker", "jane.smith", "bob.wilson",
        "threat.actor", "remote.dev", "intern.user", "service.account",
        "cloud.proxy", "mfa.test", "audit.viewer", "ciso.board",
        "devops.lead", "hr.manager", "sales.exec", "fin.analyst",
        "guest.user", "api.bot", "security.bot"
    ];

    let resources = [
        "finance/reports", "engineering/ci", "admin/root", "sales/portal", "ops/observability",
        "admin/database/secrets", "engineering/production/deploy", "marketing/assets", "api/v1/telemetry",
        "network/edge/proxy", "iam/mfa/config", "security/audit/logs", "executive/strategy",
        "legal/contracts", "hr/payroll", "git/internal/repo", "slack/archiver", "aws/s3/backups"
    ];

    println!("Cleaning existing logs...");
    sqlx::query("DELETE FROM logs").execute(&pool).await?;

    println!("Generating 160 diverse security events...");

    let mut rng = rand::thread_rng();

    for i in 0..160 {
        let user = users.choose(&mut rng).unwrap();
        let resource = resources.choose(&mut rng).unwrap();
        
        // Randomize risk and decision logic to look realistic
        let mut risk_score = rng.gen_range(0..101);
        
        // Boost risk for certain keywords
        if resource.contains("admin") || resource.contains("secrets") || resource.contains("payroll") {
            risk_score = (risk_score + 30).min(100);
        }
        if *user == "attacker" || *user == "threat.actor" {
            risk_score = (risk_score + 40).min(100);
        }

        let decision = if risk_score >= 60 {
            "DENY"
        } else if risk_score >= 30 {
            "VERIFY"
        } else {
            "ALLOW"
        };

        // Spread logs over the last 48 hours
        let created_at = (Utc::now() - Duration::minutes((i * 45) as i64)).to_rfc3339();
        
        sqlx::query(
            "INSERT INTO logs (id, user, resource, risk_score, decision, created_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(Uuid::new_v4().to_string())
        .bind(user.to_string())
        .bind(resource.to_string())
        .bind(risk_score)
        .bind(decision)
        .bind(created_at)
        .execute(&pool).await?;
    }

    println!("Success! 160 high-fidelity security events stored in agnicore.db");
    Ok(())
}
