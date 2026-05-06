#!/usr/bin/env python3
"""
AGNICORE Dataset Import Script
Downloads and imports real security logs from public datasets
"""

import os
import re
import sys
import requests
import psycopg2
from datetime import datetime, timezone
from urllib.parse import urlparse
import uuid
import random

# Dataset URLs (small samples)
DATASET_SOURCES = {
    "openssh": {
        "url": "https://raw.githubusercontent.com/logpai/loghub/master/OpenSSH/SSH.log",
        "type": "ssh"
    },
    "apache": {
        "url": "https://raw.githubusercontent.com/logpai/loghub/master/Apache/Apache.log",
        "type": "apache"
    }
}

def calculate_risk(user, resource, hour, ip, request_count):
    """Apply AGNICORE risk algorithm"""
    risk = 0
    
    # Invalid/Expired User
    if user in ['invalid_user', 'expired_user', 'root', 'attacker', 'threat.actor']:
        risk += 50
    
    # Admin Resource
    if 'admin' in resource.lower() or resource.lower() in ['admin', 'root']:
        risk += 40
    
    # Off-Hours
    if hour < 6 or hour > 22:
        risk += 20
    
    # IP Reputation
    if ip.startswith(('192.168', '10.', '127.0.0.1')):
        risk += 5
    else:
        risk += 15
    
    # Request Frequency
    if request_count > 5:
        risk += 20
    if request_count > 10:
        risk += 30
    if request_count > 20:
        risk += 50
    
    return min(risk, 100)

def determine_decision(risk_score):
    """Apply AGNICORE policy matrix"""
    if risk_score >= 60:
        return "DENY"
    elif risk_score >= 30:
        return "VERIFY"
    else:
        return "ALLOW"

def determine_location(ip):
    """Classify IP location"""
    if ip.startswith(('192.168', '10.', '127.0.0.1')):
        return "Trusted"
    elif ip.startswith(('172.16', '172.17', '172.18', '172.19', '172.20', '172.21', '172.22', '172.23', '172.24', '172.25', '172.26', '172.27', '172.28', '172.29', '172.30', '172.31')):
        return "Trusted"
    else:
        return "External"

def determine_reason(decision, risk_score):
    """Generate human-readable reason"""
    if decision == "DENY":
        return "High risk access denied"
    elif decision == "VERIFY":
        return "Medium risk - verification required"
    else:
        return "Low risk access"

def parse_ssh_log(line):
    """Parse OpenSSH log line"""
    # Pattern: Month Day HH:MM:SS server sshd[PID]: message
    pattern = r'^(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+\S+\s+sshd\[\d+\]:\s+(.*)$'
    match = re.match(pattern, line)
    
    if not match:
        return None
    
    timestamp_str, message = match.groups()
    
    # Try to parse timestamp
    try:
        # Assume current year since logs don't include year
        current_year = datetime.now().year
        timestamp = datetime.strptime(f"{current_year} {timestamp_str}", "%Y %b %d %H:%M:%S")
        timestamp = timestamp.replace(tzinfo=timezone.utc)
        hour = timestamp.hour
    except:
        timestamp = datetime.now(timezone.utc)
        hour = timestamp.hour
    
    # Extract user and IP
    user = "unknown"
    ip = "127.0.0.1"
    
    # Failed password
    failed_match = re.search(r'Failed password for (?:invalid user )?(\S+) from (\S+)', message)
    if failed_match:
        user = failed_match.group(1)
        ip = failed_match.group(2)
        action = "login"
        resource = "ssh/server"
        device = "SSH Client"
    
    # Accepted password
    accepted_match = re.search(r'Accepted password for (\S+) from (\S+)', message)
    if accepted_match:
        user = accepted_match.group(1)
        ip = accepted_match.group(2)
        action = "login"
        resource = "ssh/server"
        device = "SSH Client"
    
    # Authentication failure
    auth_fail_match = re.search(r'authentication failure.*user=(\S+).*rhost=(\S+)', message)
    if auth_fail_match:
        user = auth_fail_match.group(1)
        ip = auth_fail_match.group(2)
        action = "login"
        resource = "ssh/server"
        device = "SSH Client"
    
    return {
        'user': user,
        'ip': ip,
        'action': action,
        'resource': resource,
        'device': device,
        'hour': hour,
        'timestamp': timestamp
    }

def parse_apache_log(line):
    """Parse Apache log line"""
    # Pattern: IP - user [timestamp] "METHOD resource HTTP/version" status size
    pattern = r'^(\S+)\s+\S+\s+(\S+)\s+\[(.*?)\]\s+"(\w+)\s+(.*?)\s+HTTP.*?"\s+(\d+)\s+(\S+)'
    match = re.match(pattern, line)
    
    if not match:
        return None
    
    ip, user, timestamp_str, method, resource, status, size = match.groups()
    
    if user == '-':
        user = "anonymous"
    
    # Parse timestamp
    try:
        timestamp = datetime.strptime(timestamp_str, "%d/%b/%Y:%H:%M:%S %z")
        hour = timestamp.hour
    except:
        timestamp = datetime.now(timezone.utc)
        hour = timestamp.hour
    
    # Map HTTP method to action
    action_map = {
        'GET': 'read',
        'POST': 'write',
        'PUT': 'write',
        'DELETE': 'write',
        'PATCH': 'write'
    }
    action = action_map.get(method, 'read')
    
    return {
        'user': user,
        'ip': ip,
        'action': action,
        'resource': resource if resource else '/',
        'device': 'Web Browser',
        'hour': hour,
        'timestamp': timestamp
    }

def download_dataset(url, max_lines=1000):
    """Download dataset and return lines"""
    print(f"Downloading dataset from {url}...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        lines = response.text.strip().split('\n')
        print(f"Downloaded {len(lines)} lines")
        return lines[:max_lines]
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return []

def import_to_postgresql(records, db_url):
    """Import records to PostgreSQL"""
    print(f"Connecting to PostgreSQL...")
    
    # Parse DATABASE_URL
    parsed = urlparse(db_url)
    dbname = parsed.path[1:]  # Remove leading /
    user = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 5432
    
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port
    )
    cursor = conn.cursor()
    
    # Count existing records
    cursor.execute("SELECT COUNT(*) FROM logs")
    existing_count = cursor.fetchone()[0]
    print(f"Current log count: {existing_count}")
    
    # Insert records
    inserted = 0
    for record in records:
        try:
            cursor.execute(
                """
                INSERT INTO logs (id, "user", resource, action, ip, device, location, risk_score, decision, reason, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(uuid.uuid4()),
                    record['user'],
                    record['resource'],
                    record['action'],
                    record['ip'],
                    record['device'],
                    record['location'],
                    record['risk_score'],
                    record['decision'],
                    record['reason'],
                    record['timestamp']
                )
            )
            inserted += 1
        except Exception as e:
            print(f"Error inserting record: {e}")
            continue
    
    conn.commit()
    print(f"Inserted {inserted} new records")
    
    cursor.close()
    conn.close()

def main():
    # Get database URL
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    all_records = []
    
    # Download and parse OpenSSH logs
    print("\n=== Processing OpenSSH Dataset ===")
    ssh_lines = download_dataset(DATASET_SOURCES['openssh']['url'], max_lines=1000)
    ssh_records = []
    for line in ssh_lines:
        parsed = parse_ssh_log(line)
        if parsed:
            ssh_records.append(parsed)
    
    print(f"Parsed {len(ssh_records)} SSH records")
    
    # Download and parse Apache logs
    print("\n=== Processing Apache Dataset ===")
    apache_lines = download_dataset(DATASET_SOURCES['apache']['url'], max_lines=1000)
    apache_records = []
    for line in apache_lines:
        parsed = parse_apache_log(line)
        if parsed:
            apache_records.append(parsed)
    
    print(f"Parsed {len(apache_records)} Apache records")
    
    # Combine and calculate risk
    print("\n=== Calculating Risk Scores ===")
    combined = ssh_records + apache_records
    
    # Randomize request counts for variety
    for i, record in enumerate(combined):
        request_count = random.randint(1, 25)
        
        risk = calculate_risk(
            record['user'],
            record['resource'],
            record['hour'],
            record['ip'],
            request_count
        )
        
        decision = determine_decision(risk)
        location = determine_location(record['ip'])
        reason = determine_reason(decision, risk)
        
        record['risk_score'] = risk
        record['decision'] = decision
        record['location'] = location
        record['reason'] = reason
        
        all_records.append(record)
    
    print(f"Total records to import: {len(all_records)}")
    
    # Import to PostgreSQL
    print("\n=== Importing to PostgreSQL ===")
    import_to_postgresql(all_records, db_url)
    
    print("\n✅ Dataset import complete!")

if __name__ == '__main__':
    main()
