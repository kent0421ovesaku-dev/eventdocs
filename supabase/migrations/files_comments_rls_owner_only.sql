-- files / comments: owner-only RLS
-- 適用前提条件:
--   1. add_sessions_user_id.sql 適用済み（sessions.user_id が存在すること）
--   2. sessions_rls_owner_and_share_rpc.sql 適用済み
--   3. 公開ページの files/comments 操作が Route Handler（admin client）経由に移行済みであること
--      - GET  /api/session/[share_token]/files
--      - GET  /api/session/[share_token]/comments
--      - POST /api/session/[share_token]/comments
--   4. FileUpload.tsx / FilePanel の直接 Supabase 書き込みは、
--      このマイグレーション適用前に Route Handler 化が完了していること
--      （未対応のまま適用すると、ファイルアップロード・削除・コメント解決トグルが壊れる）

-- ========== files ==========

DROP POLICY IF EXISTS "public_access" ON public.files;
DROP POLICY IF EXISTS "files_select_own" ON public.files;
DROP POLICY IF EXISTS "files_insert_own" ON public.files;
DROP POLICY IF EXISTS "files_update_own" ON public.files;
DROP POLICY IF EXISTS "files_delete_own" ON public.files;

-- 所有者判定: files.session_id → sessions.user_id = auth.uid()
CREATE POLICY "files_select_own"
ON public.files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = files.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "files_insert_own"
ON public.files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = files.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "files_update_own"
ON public.files FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = files.session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = files.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "files_delete_own"
ON public.files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = files.session_id
      AND s.user_id = auth.uid()
  )
);

-- ========== comments ==========

DROP POLICY IF EXISTS "public_access" ON public.comments;
DROP POLICY IF EXISTS "comments_select_own" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;

-- 所有者判定: comments.session_id → sessions.user_id = auth.uid()
CREATE POLICY "comments_select_own"
ON public.comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = comments.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "comments_insert_own"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = comments.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "comments_update_own"
ON public.comments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = comments.session_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = comments.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "comments_delete_own"
ON public.comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = comments.session_id
      AND s.user_id = auth.uid()
  )
);
