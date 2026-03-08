-- 比較セッション
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- アップロードファイル
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('left', 'right')),
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ピン留めコメント
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('left', 'right')),
  x_percent FLOAT NOT NULL,
  y_percent FLOAT NOT NULL,
  commenter_name TEXT NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存DBに page_number を追加する場合: supabase/migrations/add_comments_page_number.sql を実行

-- RLS設定（share_tokenを知る人は誰でも読み書き可能）
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON sessions FOR ALL USING (true);
CREATE POLICY "public_access" ON files FOR ALL USING (true);
CREATE POLICY "public_access" ON comments FOR ALL USING (true);

-- StorageバケットはSupabaseダッシュボードで作成してください
-- バケット名: files
-- アクセス: public
