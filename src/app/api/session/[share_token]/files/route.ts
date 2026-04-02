import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/session/[share_token]/files?side=left|right
 *
 * share_token でセッションを検証したうえで、そのセッションに紐づくファイル一覧を返す。
 * anon クライアントが files テーブルを直接 broad SELECT しないための server-side 経路。
 * admin client（service role）を使い files の owner-only RLS をバイパスする。
 * share_token 検証を必ず先行させ、不正トークンへのアクセスを防ぐ。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { share_token: string } }
) {
  const { share_token } = params;
  const side = request.nextUrl.searchParams.get("side");

  if (!share_token) {
    return NextResponse.json({ error: "share_token is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // share_token を SECURITY DEFINER RPC で検証
  const { data: sessionRows, error: sessionError } = await admin.rpc(
    "get_session_by_share_token",
    { p_token: share_token }
  );
  if (sessionError) {
    return NextResponse.json({ error: "Session lookup failed" }, { status: 500 });
  }
  const session = Array.isArray(sessionRows) ? sessionRows[0] : sessionRows;
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let query = admin
    .from("files")
    .select(
      "id, session_id, side, original_name, file_type, storage_path, version, is_current, created_at"
    )
    .eq("session_id", session.id)
    .order("version", { ascending: true });

  if (side === "left" || side === "right") {
    query = query.eq("side", side);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files: data ?? [] });
}
