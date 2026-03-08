export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { createSession } from "@/lib/actions";
import { getSupabase } from "@/lib/supabase";
import type { Session } from "@/lib/supabase";
import SessionList from "@/components/SessionList";

export default async function HomePage() {
  async function submitAction(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string)?.trim() || "無題の比較";
    const shareToken = await createSession(title);
    if (shareToken) redirect(`/session/${shareToken}`);
  }

  const supabase = getSupabase();
  let sessions: Session[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
    sessions = (data ?? []) as Session[];
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            資料比較セッションを作成
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            左右に資料をアップロードして比較・コメントできます
          </p>
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

        <section>
          <h2 className="font-bold text-lg mt-8 mb-4 text-gray-900">過去のセッション</h2>
          <SessionList sessions={sessions} />
        </section>
      </div>
    </main>
  );
}
