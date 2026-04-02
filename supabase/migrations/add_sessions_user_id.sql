-- sessions に作成者（Auth ユーザー）を紐づける。既存行は NULL のまま。
-- Supabase SQL Editor または migration 実行で適用可。

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
