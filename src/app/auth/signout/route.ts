import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // サーバー側でセッションを無効化（Supabase のリフレッシュトークンを失効させる）
  const supabase = createClient();
  await supabase.auth.signOut();

  // NextResponse.redirect() は cookies() の変更をマージしない場合があるため、
  // リダイレクトレスポンス自体に対して sb-* cookie を明示削除する
  const response = NextResponse.redirect(new URL("/login?logged_out=1", request.url));

  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) {
      response.cookies.delete(name);
    }
  });

  return response;
}
