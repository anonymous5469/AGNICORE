use sqlx::PgPool;
use chrono::{Utc, Duration, Timelike};
use uuid::Uuid;
use rand::seq::SliceRandom;
use rand::Rng;
use std::time;

pub struct DataGenerator {
    pool: PgPool,
}

#[derive(Clone)]
struct UserProfile {
    username: &'static str,
    role: &'static str,
    ip_pool: Vec<&'static str>,
    device_pool: Vec<&'static str>,
    risk_bias: i32,
    weight: f64,
}

#[derive(Clone)]
struct Resource {
    path: &'static str,
    sensitivity: i32,
}

impl DataGenerator {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn get_users() -> Vec<UserProfile> {
        vec![
            UserProfile {
                username: "admin",
                role: "admin",
                ip_pool: vec!["192.168.1.4", "192.168.1.10"],
                device_pool: vec!["Linux Workstation", "MacBook Pro"],
                risk_bias: 10,
                weight: 0.15,
            },
            UserProfile {
                username: "john.doe",
                role: "user",
                ip_pool: vec!["10.0.0.15", "10.0.0.22"],
                device_pool: vec!["Windows Laptop", "iPhone"],
                risk_bias: 0,
                weight: 0.20,
            },
            UserProfile {
                username: "jane.smith",
                role: "user",
                ip_pool: vec!["192.168.1.20", "172.16.0.5"],
                device_pool: vec!["iPad", "MacBook Air"],
                risk_bias: 0,
                weight: 0.15,
            },
            UserProfile {
                username: "remote.dev",
                role: "developer",
                ip_pool: vec!["203.45.67.10", "8.8.8.8"],
                device_pool: vec!["Linux Laptop", "Chrome Browser"],
                risk_bias: 20,
                weight: 0.15,
            },
            UserProfile {
                username: "service.bot",
                role: "service",
                ip_pool: vec!["127.0.0.1", "10.0.0.100"],
                device_pool: vec!["Docker Container", "Kubernetes Pod"],
                risk_bias: -10,
                weight: 0.15,
            },
            UserProfile {
                username: "attacker",
                role: "unknown",
                ip_pool: vec!["185.220.101.45", "45.142.212.100", "103.253.145.20"],
                device_pool: vec!["Unknown Device", "Kali Linux", "Tor Browser"],
                risk_bias: 50,
                weight: 0.10,
            },
            UserProfile {
                username: "threat.actor",
                role: "unknown",
                ip_pool: vec!["198.51.100.5", "203.0.113.10"],
                device_pool: vec!["Automated Script", "Unknown Device"],
                risk_bias: 45,
                weight: 0.05,
            },
            UserProfile {
                username: "guest.user",
                role: "guest",
                ip_pool: vec!["8.8.4.4", "1.1.1.1"],
                device_pool: vec!["Chrome Browser", "Firefox Browser"],
                risk_bias: 15,
                weight: 0.05,
            },
        ]
    }

    fn get_resources() -> Vec<Resource> {
        vec![
            Resource { path: "finance/reports", sensitivity: 30 },
            Resource { path: "engineering/ci", sensitivity: 20 },
            Resource { path: "admin/root", sensitivity: 50 },
            Resource { path: "sales/portal", sensitivity: 15 },
            Resource { path: "ops/observability", sensitivity: 20 },
            Resource { path: "admin/secrets", sensitivity: 50 },
            Resource { path: "engineering/git", sensitivity: 15 },
            Resource { path: "api/v1/health", sensitivity: 5 },
            Resource { path: "public/docs", sensitivity: 0 },
            Resource { path: "network/edge", sensitivity: 35 },
            Resource { path: "iam/users", sensitivity: 40 },
            Resource { path: "security/alerts", sensitivity: 35 },
            Resource { path: "database/backups", sensitivity: 30 },
            Resource { path: "monitoring/logs", sensitivity: 25 },
            Resource { path: "hr/payroll", sensitivity: 45 },
        ]
    }

    fn calculate_risk(hour: u32, user: &UserProfile, resource: &Resource, action: &str, request_count: i32) -> i32 {
        let mut risk = user.risk_bias + resource.sensitivity;

        // Time-based risk
        if hour < 6 || hour > 22 {
            risk += 25;
        } else if hour < 9 || hour > 18 {
            risk += 15;
        }

        // Action-based risk
        if action == "write" || action == "delete" {
            risk += 20;
        } else if action == "admin" {
            risk += 35;
        }

        // Request frequency
        if request_count > 5 {
            risk += 20;
        }
        if request_count > 10 {
            risk += 30;
        }
        if request_count > 20 {
            risk += 50;
        }

        // Random variation (-10 to +10)
        let mut rng = rand::thread_rng();
        risk += rng.gen_range(-10..=10);

        risk.clamp(0, 100)
    }

    fn determine_decision(risk_score: i32) -> &'static str {
        if risk_score >= 60 {
            "DENY"
        } else if risk_score >= 30 {
            "VERIFY"
        } else {
            "ALLOW"
        }
    }

    fn determine_location(ip: &str) -> &'static str {
        if ip.starts_with("192.168") || ip.starts_with("10.") || ip.starts_with("172.16") || ip == "127.0.0.1" {
            "Trusted"
        } else if ip.starts_with("8.8") || ip.starts_with("1.1") {
            "External"
        } else {
            "Unknown"
        }
    }

    fn generate_reason(decision: &str, risk_score: i32) -> String {
        match decision {
            "DENY" => {
                if risk_score > 80 {
                    "Critical threat detected: multiple high-risk indicators triggered".to_string()
                } else {
                    "High risk access denied: elevated risk score exceeds threshold".to_string()
                }
            }
            "VERIFY" => {
                if risk_score > 45 {
                    "Medium-high risk: step-up verification required for access".to_string()
                } else {
                    "Medium risk: additional verification recommended".to_string()
                }
            }
            _ => {
                if risk_score < 15 {
                    "Low risk access: normal behavioral pattern confirmed".to_string()
                } else {
                    "Standard access granted within acceptable risk bounds".to_string()
                }
            }
        }
    }

    async fn insert_log(&self, log: &GeneratedLog) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO logs (id, \"user\", resource, action, ip, device, location, risk_score, decision, reason, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
        )
        .bind(&log.id)
        .bind(&log.user)
        .bind(&log.resource)
        .bind(&log.action)
        .bind(&log.ip)
        .bind(&log.device)
        .bind(&log.location)
        .bind(log.risk_score)
        .bind(&log.decision)
        .bind(&log.reason)
        .bind(log.timestamp)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    fn generate_single_log(hour: u32) -> GeneratedLog {
        let users = Self::get_users();
        let resources = Self::get_resources();
        let mut rng = rand::thread_rng();

        let user = users.choose_weighted(&mut rng, |u| u.weight).unwrap();
        let resource = resources.choose(&mut rng).unwrap();
        let ip = user.ip_pool.choose(&mut rng).unwrap();
        let device = user.device_pool.choose(&mut rng).unwrap();
        
        let action = if rng.gen_bool(0.7) {
            "read"
        } else if rng.gen_bool(0.6) {
            "write"
        } else {
            "admin"
        };

        let request_count = rng.gen_range(1..25);
        let risk_score = Self::calculate_risk(hour, user, resource, action, request_count);
        let decision = Self::determine_decision(risk_score);
        let location = Self::determine_location(ip);
        let reason = Self::generate_reason(decision, risk_score);
        
        let minutes_ago = rng.gen_range(0..60);
        let timestamp = Utc::now() - Duration::minutes(minutes_ago);

        GeneratedLog {
            id: Uuid::new_v4().to_string(),
            user: user.username.to_string(),
            resource: resource.path.to_string(),
            action: action.to_string(),
            ip: ip.to_string(),
            device: device.to_string(),
            location: location.to_string(),
            risk_score,
            decision: decision.to_string(),
            reason,
            timestamp,
        }
    }

    pub async fn generate_batch(&self) -> Result<usize, sqlx::Error> {
        let hour = Utc::now().hour();
        let batch_size = if hour >= 6 && hour < 18 {
            3 // Day time: 3 records
        } else {
            8 // Night time: 8 records
        };

        // Generate all logs synchronously (no await, no thread issues)
        let logs: Vec<GeneratedLog> = (0..batch_size)
            .map(|_| Self::generate_single_log(hour))
            .collect();

        let mut inserted = 0;
        for log in logs {
            if let Err(e) = self.insert_log(&log).await {
                tracing::error!("Failed to insert generated log: {}", e);
            } else {
                inserted += 1;
            }
        }

        Ok(inserted)
    }

    pub async fn start_background(self) {
        tracing::info!("Starting background data generator...");
        
        loop {
            let hour = Utc::now().hour();
            let batch_size = if hour >= 6 && hour < 18 { 3 } else { 8 };
            
            tracing::info!("Generating {} records (hour: {})", batch_size, hour);
            
            match self.generate_batch().await {
                Ok(count) => tracing::info!("Generated {} records", count),
                Err(e) => tracing::error!("Failed to generate batch: {}", e),
            }

            // Sleep for 1 hour
            tokio::time::sleep(time::Duration::from_secs(3600)).await;
        }
    }
}

struct GeneratedLog {
    id: String,
    user: String,
    resource: String,
    action: String,
    ip: String,
    device: String,
    location: String,
    risk_score: i32,
    decision: String,
    reason: String,
    timestamp: chrono::DateTime<Utc>,
}
