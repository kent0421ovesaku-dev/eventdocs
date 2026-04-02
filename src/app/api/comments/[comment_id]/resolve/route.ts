import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/comments/[comment_id]/resolve
 *
 * コメントの is_resolved をトグルする。ログイン済み owner のみ操作可。
 * - auth.getUser() でログイン確認
 * - comment の session_id → sessions.user_id を照合し、owner でなければ 403
 * - クライアントから is_resolved の値は受け取らず、サーバーでトグル
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { comment_id: string } }
) {
  const { comment_id } = params;

  if (!comment_id) {
    return NextResponse.json({ error: "comment_id is required" }, { status: 400 });
  }

  // 1. ログイン確認（anon は 401）
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 2. コメント取得（RLS 未適用状態でも確実に取れるよう admin client 使用）
  const { data: comment, error: commentError } = await admin
    .from("comments")
    .select("id, session_id, is_resolved")
    .eq("id", comment_id)
    .single();

  if (commentError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // 3. session の所有者確認（RLS に依存しない明示的チェック）
  const { data: session, error: sessionError } = await admin
    .from("sessions")
    .select("user_id")
    .eq("id", comment.session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. is_resolved をトグル
  const { data: updated, error: updateError } = await admin
    .from("comments")
    .update({ is_resolved: !comment.is_resolved })
    .eq("id", comment_id)
    .select("id, is_resolved")
    .single();

  if (updateError) {
    console.error("resolve toggle error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ comment: updated });
}
