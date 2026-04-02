import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * 除外方針:
 * - /session/* … 共有リンク閲覧は公開のまま。ミドルウェアを通さずオーバーヘッドも避ける。
 * - _next/static, _next/image, favicon, 画像拡張子 … 静的・アセットは Supabase セッション不要。
 * 上記以外は updateSession のみ実行（未ログインでもリダイレクトしない）。
 */
export const config = {
  matcher: [
    "/((?!session/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
