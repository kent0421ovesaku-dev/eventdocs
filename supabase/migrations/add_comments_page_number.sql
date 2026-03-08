-- 既存の comments テーブルに page_number を追加（Supabase SQL Editor で実行可）
ALTER TABLE comments ADD COLUMN IF NOT EXISTS page_number INTEGER DEFAULT 1;
