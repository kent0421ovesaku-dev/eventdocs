import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser / Client Components 用。Auth の cookie セッションと同期する。
 * 既存の getSupabase()（anon・従来クライアント）とは別。ログイン UI 等はこちらを使う。
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient(url, key);
}
