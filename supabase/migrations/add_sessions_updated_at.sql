-- sessions テーブルに updated_at カラムを追加し、自動更新トリガーを設定する

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 既存行は created_at で初期化
UPDATE public.sessions
  SET updated_at = created_at
  WHERE updated_at IS NULL;

-- updated_at を自動更新する汎用関数（他テーブルにも使い回せる）
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- sessions 専用トリガー
DROP TRIGGER IF EXISTS sessions_set_updated_at ON public.sessions;
CREATE TRIGGER sessions_set_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
