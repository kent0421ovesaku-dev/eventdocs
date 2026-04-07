import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import MySessionsSection from "@/components/dashboard/MySessionsSection";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/actions";
import type { Session } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ダッシュボード | 資料比較・コメントサービス",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  const mySessions = (data ?? []) as Session[];
  const sessionError = searchParams.session_error === "1";

  async function createNewSession() {
    "use server";
    const shareToken = await createSession("無題の比較");
    if (shareToken) redirect(`/session/${shareToken}`);
    redirect("/dashboard?session_error=1");
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              トップに戻る
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          {sessionError && (
            <p
              className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-3"
              role="alert"
            >
              セッションを作成できませんでした。しばらくしてから再度お試しください。
            </p>
          )}
          <form action={createNewSession}>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition text-sm font-medium"
            >
              + 新規セッションを作成
            </button>
          </form>
        </div>

        <MySessionsSection sessions={mySessions} />
      </div>
    </main>
  );
}
