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

      {/* 以降は中央配置コンテンツ */}
      <main className="flex flex-col items-center px-6 pb-16">

        {/* 特徴セクション */}
        <section className="w-full max-w-2xl mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* 左右で比較 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M3 9h18M3 15h18" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">左右で比較</h3>
              <p className="text-xs text-gray-500 leading-relaxed min-h-[2.8rem]">2つの資料を並べて、差分をスクロールしながら確認できます</p>
            </div>

            {/* コメント */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">コメント</h3>
              <p className="text-xs text-gray-500 leading-relaxed min-h-[2.8rem]">気になる箇所を指定して、確認コメントを残せます</p>
            </div>

            {/* URL共有 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="flex justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">URL共有</h3>
              <p className="text-xs text-gray-500 leading-relaxed min-h-[2.8rem]">専用URLを発行。ログイン不要でクライアントと共有できます</p>
            </div>

          </div>
        </section>

        {/* Legacy セッション一覧（デモ用） */}
        {legacyPublicSessionList && (
          <section className="w-full max-w-2xl mb-16">
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
        )}

        {/* フッターノート */}
        <p className="text-xs text-gray-400 text-center max-w-xl">
          セッション一覧は公開されません。共有URLを知っている方だけがアクセスできます。
        </p>

      </main>
    </div>
  );
}
