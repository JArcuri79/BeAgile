-- Add banned flag to companies for blocking/unblocking
ALTER TABLE companies ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;
