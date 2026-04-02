import { createClient } from "@supabase/supabase-js";

/**
 * Service role admin client（サーバー専用・RLS バイパス）。
 * クライアントサイドには絶対に渡さない。
 * Route Handler など server-only のコンテキストで、
 * share_token 検証済みの公開経路に使用する。
 *
 * 必要な環境変数: SUPABASE_SERVICE_ROLE_KEY（NEXT_PUBLIC_ なし）
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceRole) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Set SUPABASE_SERVICE_ROLE_KEY in .env.local (no NEXT_PUBLIC_ prefix)."
    );
  }
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
