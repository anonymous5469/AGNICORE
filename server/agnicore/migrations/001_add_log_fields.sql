-- Migration: Add new fields to logs table for real data tracking
-- Run this on your PostgreSQL database

DO $$
BEGIN
    -- Add action column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs' AND column_name = 'action'
    ) THEN
        ALTER TABLE logs ADD COLUMN action VARCHAR(50) NOT NULL DEFAULT 'read';
    END IF;

    -- Add ip column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs' AND column_name = 'ip'
    ) THEN
        ALTER TABLE logs ADD COLUMN ip VARCHAR(45) NOT NULL DEFAULT '127.0.0.1';
    END IF;

    -- Add device column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs' AND column_name = 'device'
    ) THEN
        ALTER TABLE logs ADD COLUMN device VARCHAR(100);
    END IF;

    -- Add location column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs' AND column_name = 'location'
    ) THEN
        ALTER TABLE logs ADD COLUMN location VARCHAR(50) NOT NULL DEFAULT 'Unknown';
    END IF;

    -- Add reason column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs' AND column_name = 'reason'
    ) THEN
        ALTER TABLE logs ADD COLUMN reason TEXT;
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'logs' 
ORDER BY ordinal_position;
