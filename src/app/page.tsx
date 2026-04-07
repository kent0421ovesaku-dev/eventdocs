export const dynamic = 'force-dynamic';

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/actions";
import { getSupabase } from "@/lib/supabase";
import type { Session } from "@/lib/supabase";
import SessionList from "@/components/SessionList";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/HeroSection";

/** 本番では未設定のまま。ローカルデモで従来の「全件一覧」が必要なときだけ true */
const legacyPublicSessionList =
  process.env.SHOW_LEGACY_HOME_SESSION_LIST === "true";

type HomePageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const sessionError = searchParams.session_error === "1";

  async function submitAction(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string)?.trim() || "無題の比較";
    const shareToken = await createSession(title);
    if (shareToken) redirect(`/session/${shareToken}`);
    redirect("/?session_error=1");
  }

  const supabaseServer = createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  const supabase = getSupabase();
  let sessions: Session[] = [];
  if (legacyPublicSessionList && supabase) {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
    sessions = (data ?? []) as Session[];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background-tertiary,#f8f9fa)]">

      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900 text-sm tracking-tight">eventdocs</span>
          <span className="text-gray-300 text-sm">/</span>
          <span className="text-gray-400 text-sm font-normal">資料比較</span>
        </div>
        <nav>
          {user ? (
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
              ダッシュボード
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              受託者ログイン
            </Link>
          )}
        </nav>
      </header>

      {/* ヒーロー（2カラム）+ フォーム + デモ画像 */}
      <HeroSection submitAction={submitAction} sessionError={sessionError} />

      {/* Legacy セッション一覧（デモ用） */}
      {legacyPublicSessionList && (
        <main className="flex flex-col items-center px-6 pb-16">
          <section className="w-full max-w-2xl">
            <div
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              デモ用設定です。このURLを知っている人は全セッションを一覧できます。本番では{" "}
              <code className="rounded bg-amber-100/80 px-1">SHOW_LEGACY_HOME_SESSION_LIST</code>{" "}
              を無効のままにしてください。
            </div>
            <h2 className="font-bold text-lg mb-4 text-gray-900">過去のセッション</h2>
            <SessionList sessions={sessions} />
          </section>
        </main>
      )}
    </div>
  );
}
