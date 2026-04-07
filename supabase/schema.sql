-- 比較セッション
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- 既存DBに user_id を追加する場合: supabase/migrations/add_sessions_user_id.sql を実行

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

-- 共有URL: anon は sessions テーブルを直接 SELECT せず、この RPC で1件のみ取得（SECURITY DEFINER）
CREATE OR REPLACE FUNCTION public.get_session_by_share_token(p_token text)
RETURNS TABLE (
  id uuid,
  title text,
  share_token text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.title, s.share_token
  FROM public.sessions s
  WHERE s.share_token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_session_by_share_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_session_by_share_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_session_by_share_token(text) TO authenticated;

-- RLS設定
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- sessions: 認証ユーザーは自分の行のみ。共有閲覧は get_session_by_share_token を使用。
CREATE POLICY "sessions_select_own" ON sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- files: owner-only（session_id → sessions.user_id = auth.uid()）
-- 公開共有ページの閲覧・投稿は Route Handler（admin client）経由で担保。
-- 既存DBへの適用は supabase/migrations/files_comments_rls_owner_only.sql を実行。
CREATE POLICY "files_select_own" ON files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = files.session_id AND s.user_id = auth.uid()));
CREATE POLICY "files_insert_own" ON files FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = files.session_id AND s.user_id = auth.uid()));
CREATE POLICY "files_update_own" ON files FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = files.session_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = files.session_id AND s.user_id = auth.uid()));
CREATE POLICY "files_delete_own" ON files FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = files.session_id AND s.user_id = auth.uid()));

-- comments: owner-only（同上）
CREATE POLICY "comments_select_own" ON comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = comments.session_id AND s.user_id = auth.uid()));
CREATE POLICY "comments_insert_own" ON comments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = comments.session_id AND s.user_id = auth.uid()));
CREATE POLICY "comments_update_own" ON comments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = comments.session_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = comments.session_id AND s.user_id = auth.uid()));
CREATE POLICY "comments_delete_own" ON comments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM sessions s WHERE s.id = comments.session_id AND s.user_id = auth.uid()));

-- StorageバケットはSupabaseダッシュボードで作成してください
-- バケット名: files
-- アクセス: private（読み取りは /api/storage/signed-url 経由の署名付き URL）
-- storage.objects ポリシー: supabase/migrations/storage_files_private_rls.sql
