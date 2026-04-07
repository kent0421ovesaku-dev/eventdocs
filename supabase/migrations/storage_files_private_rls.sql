-- Storage バケット `files` を PRIVATE にしたあと、クライアントからの直接読み取りは行わず
-- Route Handler（service role）の createSignedUrl のみで配布する想定。
-- アップロード・削除は引き続きブラウザの authenticated ユーザーが行うため、
-- INSERT / UPDATE / DELETE のみオーナー（sessions.user_id = auth.uid()）に限定する。
--
-- 適用手順（概要）:
-- 1. Supabase Dashboard → Storage → files バケットを Private に変更
-- 2. 既存の「Public read」系ポリシーがあれば削除
-- 3. 本マイグレーションを実行
--
-- 注意: ダッシュボードで作成済みのポリシー名が異なる場合は、手動で同等内容に差し替えてください。

-- よくある公開読み取りポリシー（存在すれば削除）
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to public folder 1oj01k_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in public folder 1oj01k_0" ON storage.objects;

DROP POLICY IF EXISTS "files_storage_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "files_storage_update_owner" ON storage.objects;
DROP POLICY IF EXISTS "files_storage_delete_owner" ON storage.objects;

-- 認証ユーザーのオブジェクト操作（パス先頭: session UUID / 2 番目: left|right）
CREATE POLICY "files_storage_insert_owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'files'
  AND split_part(name, '/', 2) IN ('left', 'right')
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = (split_part(name, '/', 1))::uuid
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "files_storage_update_owner"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'files'
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = (split_part(name, '/', 1))::uuid
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'files'
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = (split_part(name, '/', 1))::uuid
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "files_storage_delete_owner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'files'
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = (split_part(name, '/', 1))::uuid
      AND s.user_id = auth.uid()
  )
);

-- SELECT（直接 download）は付与しない。読み取りは service role の署名付き URL のみ。
