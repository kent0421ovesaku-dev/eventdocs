import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_NAME_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;

type AdminClient = ReturnType<typeof createAdminClient>;

/** share_token → session を解決する共通ヘルパー */
async function resolveSession(admin: AdminClient, share_token: string) {
  const { data: rows, error } = await admin.rpc("get_session_by_share_token", {
    p_token: share_token,
  });
  if (error) return null;
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row ?? null;
}

/**
 * GET /api/session/[share_token]/comments?side=left|right
 *
 * share_token でセッションを検証したうえで、そのセッションに紐づくコメント一覧を返す。
 * anon クライアントが comments テーブルを直接 broad SELECT しないための server-side 経路。
 * side パラメータ省略時はセッション全コメントを返す（CommentSidebar 用）。
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

  const session = await resolveSession(admin, share_token);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let query = admin
    .from("comments")
    .select(
      "id, session_id, side, x_percent, y_percent, commenter_name, content, page_number, is_resolved, created_at"
    )
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  if (side === "left" || side === "right") {
    query = query.eq("side", side);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

/**
 * POST /api/session/[share_token]/comments
 *
 * クライアントは share_token と入力内容だけを送る。
 * session_id はサーバー側で share_token から解決し、クライアントから信用しない。
 * is_resolved は常に false で固定（クライアントから受け付けない）。
 *
 * スパム対策（レート制限等）を入れる場合はこのハンドラ内の先頭で行う。
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { share_token: string } }
) {
  const { share_token } = params;
  if (!share_token) {
    return NextResponse.json({ error: "share_token is required" }, { status: 400 });
  }

  // --- 入力パース ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    side,
    x_percent,
    y_percent,
    commenter_name,
    content,
    page_number,
  } = body as Record<string, unknown>;

  // --- サーバー側バリデーション ---
  if (side !== "left" && side !== "right") {
    return NextResponse.json({ error: "side must be 'left' or 'right'" }, { status: 422 });
  }
  if (typeof x_percent !== "number" || x_percent < 0 || x_percent > 100) {
    return NextResponse.json({ error: "x_percent must be a number between 0 and 100" }, { status: 422 });
  }
  if (typeof y_percent !== "number" || y_percent < 0 || y_percent > 100) {
    return NextResponse.json({ error: "y_percent must be a number between 0 and 100" }, { status: 422 });
  }
  if (
    typeof commenter_name !== "string" ||
    commenter_name.trim().length === 0 ||
    commenter_name.trim().length > MAX_NAME_LENGTH
  ) {
    return NextResponse.json(
      { error: `commenter_name must be 1–${MAX_NAME_LENGTH} characters` },
      { status: 422 }
    );
  }
  if (
    typeof content !== "string" ||
    content.trim().length === 0 ||
    content.trim().length > MAX_CONTENT_LENGTH
  ) {
    return NextResponse.json(
      { error: `content must be 1–${MAX_CONTENT_LENGTH} characters` },
      { status: 422 }
    );
  }
  const pageNum =
    page_number === undefined || page_number === null
      ? 1
      : Number(page_number);
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return NextResponse.json({ error: "page_number must be a positive integer" }, { status: 422 });
  }

  const admin = createAdminClient();

  // --- share_token から session_id を解決（クライアントの session_id を信用しない）---
  const session = await resolveSession(admin, share_token);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("comments")
    .insert({
      session_id: session.id,           // サーバー側で解決した値のみ使用
      side,
      x_percent,
      y_percent,
      commenter_name: commenter_name.trim(),
      content: content.trim(),
      page_number: pageNum,
      is_resolved: false,               // 新規投稿は常に未解決
    })
    .select(
      "id, session_id, side, x_percent, y_percent, commenter_name, content, page_number, is_resolved, created_at"
    )
    .single();

  if (error) {
    console.error("comment insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
