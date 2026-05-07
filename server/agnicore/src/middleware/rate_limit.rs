use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use axum::extract::{ConnectInfo, Request};
use axum::middleware::Next;
use axum::response::Response;

#[derive(Clone, Debug)]
struct RequestCount {
    count: u32,
    window_start: Instant,
}

#[derive(Debug)]
pub struct RateLimiter {
    requests: Mutex<HashMap<SocketAddr, RequestCount>>,
    max_requests: u32,
    window_duration: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: u32, window_seconds: u64) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            window_duration: Duration::from_secs(window_seconds),
        }
    }

    pub fn check_rate_limit(&self,
        addr: SocketAddr,
    ) -> Result<(), crate::errors::AppError> {
        let mut requests = self.requests.lock().unwrap();
        let now = Instant::now();

        let entry = requests.entry(addr).or_insert(RequestCount {
            count: 0,
            window_start: now,
        });

        // Reset window if expired
        if now.duration_since(entry.window_start) > self.window_duration {
            entry.count = 0;
            entry.window_start = now;
        }

        if entry.count >= self.max_requests {
            return Err(crate::errors::AppError::Forbidden);
        }

        entry.count += 1;
        Ok(())
    }
}

// Rate limit middleware for specific endpoints
pub async fn token_rate_limit_middleware(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    req: Request,
    next: Next,
) -> Result<Response, crate::errors::AppError> {
    // Create a static rate limiter: 5 requests per minute for token endpoint
    use std::sync::OnceLock;
    static RATE_LIMITER: OnceLock<RateLimiter> = OnceLock::new();
    let limiter = RATE_LIMITER.get_or_init(|| RateLimiter::new(5, 60));
    
    limiter.check_rate_limit(addr)?;
    Ok(next.run(req).await)
}

// General rate limiter: 100 requests per minute
pub async fn general_rate_limit_middleware(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    req: Request,
    next: Next,
) -> Result<Response, crate::errors::AppError> {
    use std::sync::OnceLock;
    static RATE_LIMITER: OnceLock<RateLimiter> = OnceLock::new();
    let limiter = RATE_LIMITER.get_or_init(|| RateLimiter::new(100, 60));
    
    limiter.check_rate_limit(addr)?;
    Ok(next.run(req).await)
}