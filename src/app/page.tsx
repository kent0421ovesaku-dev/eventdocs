export const dynamic = 'force-dynamic';

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/actions";
import { getSupabase } from "@/lib/supabase";
import type { Session } from "@/lib/supabase";
import SessionList from "@/components/SessionList";
import { createClient } from "@/lib/supabase/server";

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

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center px-6 py-16">

        {/* ヒーロー */}
        <section className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            資料を並べて、確認を前に進める
          </h1>
          <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
            2つの資料を左右に並べて比較・コメント。<br />
            共有URLで関係者と確認できます。
          </p>
        </section>

        {/* フォームカード */}
        <section className="w-full max-w-[480px] mb-16">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {sessionError && (
              <p
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-4"
                role="alert"
              >
                セッションを作成できませんでした。しばらくしてから再度お試しください。
              </p>
            )}
            <form action={submitAction} className="space-y-3">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  セッションタイトル
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="例: イベントA 資料比較"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 active:bg-gray-950 transition"
              >
                比較セッションを作成
              </button>
            </form>
            <p className="mt-3 text-xs text-gray-400 text-center">
              作成には{" "}
              <Link href="/login" className="underline hover:text-gray-600">
                ログイン
              </Link>
              {" "}が必要です
            </p>
          </div>
        </section>

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
        )}

        {/* デモ画像セクション */}
        <section className="w-full max-w-[720px] mb-16">
          <p className="text-xs text-gray-400 text-center mb-4">実際の画面</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://fblixafcxdnryhqfnnfa.supabase.co/storage/v1/object/public/files/demo_comment.png"
                alt="コメント機能のスクリーンショット"
                className="w-full rounded-lg border border-gray-200 object-cover"
              />
              <figcaption className="text-xs text-gray-400 text-center">コメント機能</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://fblixafcxdnryhqfnnfa.supabase.co/storage/v1/object/public/files/demo_difference.png"
                alt="差分検出のスクリーンショット"
                className="w-full rounded-lg border border-gray-200 object-cover"
              />
              <figcaption className="text-xs text-gray-400 text-center">差分検出</figcaption>
            </figure>
          </div>
        </section>

        {/* フッターノート */}
        <p className="text-xs text-gray-400 text-center max-w-xl">
          セッション一覧は公開されません。共有URLを知っている方だけがアクセスできます。
        </p>

      </main>
    </div>
  );
}
