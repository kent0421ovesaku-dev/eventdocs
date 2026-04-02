-- sessions: owner-only RLS + 共有URL用 RPC（anon のテーブル直接 SELECT は不可）
-- 適用前に add_sessions_user_id.sql 済みであること。

DROP POLICY IF EXISTS "public_access" ON public.sessions;

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

DROP POLICY IF EXISTS "sessions_select_own" ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_own" ON public.sessions;
DROP POLICY IF EXISTS "sessions_delete_own" ON public.sessions;

CREATE POLICY "sessions_select_own"
ON public.sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own"
ON public.sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_delete_own"
ON public.sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
