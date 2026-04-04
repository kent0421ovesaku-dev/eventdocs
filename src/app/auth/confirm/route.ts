import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/confirm?code=...
 *
 * Supabase がパスワード再設定メールのリンクに付与する code を
 * exchangeCodeForSession でセッションに交換し、/update-password へリダイレクトする。
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=invalid_code`);
  }

  return NextResponse.redirect(`${origin}/update-password`);
}
