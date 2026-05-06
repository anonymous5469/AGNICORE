#!/usr/bin/env python3
"""
AGNICORE Log Cleanup Script
Deletes logs older than 30 days to maintain database performance
"""

import os
import sys
import psycopg2
from datetime import datetime, timedelta
from urllib.parse import urlparse

def cleanup_old_logs(db_url, days=30):
    """Delete logs older than specified days"""
    # Parse DATABASE_URL
    parsed = urlparse(db_url)
    dbname = parsed.path[1:]  # Remove leading /
    user = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 5432
    
    print(f"Connecting to PostgreSQL...")
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port
    )
    cursor = conn.cursor()
    
    # Calculate cutoff date
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Count records before deletion
    cursor.execute("SELECT COUNT(*) FROM logs")
    total_before = cursor.fetchone()[0]
    
    # Count records to delete
    cursor.execute("SELECT COUNT(*) FROM logs WHERE created_at < %s", (cutoff_date,))
    to_delete = cursor.fetchone()[0]
    
    if to_delete == 0:
        print(f"No logs older than {days} days found. Skipping cleanup.")
        cursor.close()
        conn.close()
        return 0
    
    # Delete old records
    print(f"Deleting {to_delete} logs older than {days} days (before {cutoff_date.date()})...")
    cursor.execute("DELETE FROM logs WHERE created_at < %s", (cutoff_date,))
    
    conn.commit()
    
    # Count records after deletion
    cursor.execute("SELECT COUNT(*) FROM logs")
    total_after = cursor.fetchone()[0]
    
    print(f"✅ Cleanup complete!")
    print(f"   Deleted: {to_delete} records")
    print(f"   Remaining: {total_after} records")
    
    cursor.close()
    conn.close()
    
    return to_delete

def main():
    # Get database URL
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Get retention days (default 30)
    days = int(os.environ.get('LOG_RETENTION_DAYS', '30'))
    
    print(f"AGNICORE Log Cleanup")
    print(f"Retention period: {days} days")
    print(f"Current time: {datetime.now()}")
    print()
    
    deleted = cleanup_old_logs(db_url, days)
    
    if deleted > 0:
        print(f"\n🗑️  Deleted {deleted} old log records")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
