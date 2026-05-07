use chrono::Timelike;

pub fn current_hour() -> u32 {
    chrono::Utc::now().hour()
}