-- Supabase SQL Editor で実行してください。
ALTER TABLE files ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_files_session_side
ON files(session_id, side, is_current);
