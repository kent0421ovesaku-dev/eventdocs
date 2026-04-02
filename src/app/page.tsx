export const dynamic = 'force-dynamic';

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/actions";
import { getSupabase } from "@/lib/supabase";
import type { Session } from "@/lib/supabase";
import SessionList from "@/components/SessionList";

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
    <main className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex justify-end mb-2">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            受託者ログイン
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            資料比較セッションを作成
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            左右に資料をアップロードして比較・コメントできます
          </p>
          <p className="text-gray-600 text-sm mb-4">
            セッションの作成には{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              ログイン
            </Link>
            が必要です。
          </p>
          {sessionError && (
            <p
              className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-4"
              role="alert"
            >
              セッションを作成できませんでした。しばらくしてから再度お試しください。
            </p>
          )}
          <form action={submitAction} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                セッションタイトル
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="例: イベントA 資料比較"
                className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition"
            >
              比較セッションを作成
            </button>
          </form>
        </div>

        {legacyPublicSessionList ? (
          <section>
            <div
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              デモ用設定です。このURLを知っている人は全セッションを一覧できます。本番では{" "}
              <code className="rounded bg-amber-100/80 px-1">SHOW_LEGACY_HOME_SESSION_LIST</code>{" "}
              を無効のままにしてください。
            </div>
            <h2 className="font-bold text-lg mt-8 mb-4 text-gray-900">過去のセッション</h2>
            <SessionList sessions={sessions} />
          </section>
        ) : (
          <section className="mt-8">
            <h2 className="font-bold text-lg mb-4 text-gray-900">セッション一覧について</h2>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-sm text-gray-600 space-y-3">
              <p>
                トップでは全員分のセッションを一覧しません。作成すると共有用URLへ進みます。共有URLを知っている方だけがそのセッションを開けます。
              </p>
              <p>
                受託者の方は{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  ログイン
                </Link>
                後、
                <Link href="/dashboard" className="text-blue-600 hover:underline">
                  ダッシュボード
                </Link>
                で自分のセッションをまとめて扱えるようになります（データの紐づけは順次対応予定）。
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
