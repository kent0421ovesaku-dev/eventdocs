import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const SIGNED_URL_EXPIRES_SEC = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseAndValidateStoragePath(storagePath: string): { sessionId: string } | null {
  if (!storagePath || storagePath.includes("..") || storagePath.startsWith("/")) {
    return null;
  }
  const parts = storagePath.split("/").filter(Boolean);
  if (parts.length < 3) return null;
  const [sessionId, side] = parts;
  if (!UUID_RE.test(sessionId)) return null;
  if (side !== "left" && side !== "right") return null;
  return { sessionId };
}

/**
 * GET /api/storage/signed-url?storage_path=...&share_token=...
 *
 * storage_path に対応する files 行が存在し、かつ
 * - ログイン済みで当該セッションのオーナー、または
 * - share_token が当該セッションの共有トークンと一致
 * のときのみ、60 秒有効の署名付き URL を返す。
 */
export async function GET(request: NextRequest) {
  const storagePath = request.nextUrl.searchParams.get("storage_path");
  const shareToken = request.nextUrl.searchParams.get("share_token");

  if (!storagePath) {
    return NextResponse.json({ error: "storage_path is required" }, { status: 400 });
  }

  const parsed = parseAndValidateStoragePath(storagePath);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid storage_path" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: fileRow, error: fileErr } = await admin
    .from("files")
    .select("id")
    .eq("session_id", parsed.sessionId)
    .eq("storage_path", storagePath)
    .maybeSingle();

  if (fileErr) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!fileRow) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: session, error: sessionErr } = await admin
    .from("sessions")
    .select("id, user_id, share_token")
    .eq("id", parsed.sessionId)
    .maybeSingle();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const supabaseAuth = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  const isOwner = !!user?.id && session.user_id === user.id;
  const isShareViewer =
    !!shareToken && shareToken.length > 0 && shareToken === session.share_token;

  if (!isOwner && !isShareViewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: signed, error: signErr } = await admin.storage
    .from("files")
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRES_SEC);

  if (signErr || !signed?.signedUrl) {
    console.error("createSignedUrl error:", signErr);
    return NextResponse.json({ error: "Could not create signed URL" }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    expiresIn: SIGNED_URL_EXPIRES_SEC,
  });
}
