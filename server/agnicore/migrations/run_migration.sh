#!/bin/bash
# AGNICORE Database Migration Script
# Run this in Render Shell

echo "=== AGNICORE Database Migration ==="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable not set!"
    echo "Please set it first: export DATABASE_URL=your_database_url"
    exit 1
fi

echo "✓ DATABASE_URL found"
echo ""

# Install PostgreSQL client if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL client..."
    apt-get update -qq && apt-get install -y -qq postgresql-client
fi

echo "✓ PostgreSQL client ready"
echo ""

# Run migration
echo "Running migration..."
psql "$DATABASE_URL" -f server/agnicore/migrations/001_add_log_fields.sql

echo ""
echo "=== Migration Complete ==="
echo ""
echo "Verifying schema..."
psql "$DATABASE_URL" -c "\d logs"

echo ""
echo "✅ All done! Your database is ready for real data."
