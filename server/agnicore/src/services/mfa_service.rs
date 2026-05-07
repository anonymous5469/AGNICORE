use oath::totp_raw;
use rand::{Rng, distributions::Alphanumeric};

const TOTP_STEP: u64 = 30;
const DIGITS: u32 = 6;

pub fn generate_secret() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect()
}

pub fn verify_otp(secret: &str, code: &str) -> bool {
    let expected = totp_raw(
        secret.as_bytes(),
        DIGITS,
        0,
        TOTP_STEP,
    );

    format!("{:0width$}", expected, width = DIGITS as usize) == code
}

pub fn generate_otpauth_url(user: &str, secret: &str) -> String {
    format!(
        "otpauth://totp/Agnicore:{}?secret={}&issuer=Agnicore",
        user, secret
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_secret_length() {
        let secret = generate_secret();
        assert_eq!(secret.len(), 32);
        assert!(secret.chars().all(|c| c.is_ascii_alphanumeric()));
    }

    #[test]
    fn test_generate_otpauth_url_format() {
        let url = generate_otpauth_url("testuser", "TESTSECRET123");
        assert!(url.contains("otpauth://totp/"));
        assert!(url.contains("testuser"));
        assert!(url.contains("TESTSECRET123"));
        assert!(url.contains("Agnicore"));
    }

    #[test]
    fn test_verify_otp_valid() {
        let secret = "TESTSECRET1234567890ABCDEF";
        let code = totp_raw(secret.as_bytes(), DIGITS, 0, TOTP_STEP);
        let formatted_code = format!("{:0width$}", code, width = DIGITS as usize);
        
        assert!(verify_otp(secret, &formatted_code));
    }

    #[test]
    fn test_verify_otp_invalid() {
        let secret = "TESTSECRET1234567890ABCDEF";
        assert!(!verify_otp(secret, "000000"));
    }

    #[test]
    fn test_verify_otp_wrong_length() {
        let secret = "TESTSECRET1234567890ABCDEF";
        let code = totp_raw(secret.as_bytes(), DIGITS, 0, TOTP_STEP);
        let formatted_code = format!("{:0width$}", code, width = DIGITS as usize);
        
        // Wrong length should fail
        assert!(!verify_otp(secret, &format!("{}1", formatted_code)));
    }
}