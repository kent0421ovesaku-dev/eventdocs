-- Supabase SQL Editor で実行するか、マイグレーションとして適用してください。
-- comments テーブルに is_resolved を追加
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;

-- 機能③ Realtime 用: Database → Replication で comments を有効化するか、以下を実行
-- ALTER PUBLICATION supabase_realtime ADD TABLE comments;
