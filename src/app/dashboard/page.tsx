import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import MySessionsSection from "@/components/dashboard/MySessionsSection";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ダッシュボード | 資料比較・コメントサービス",
};

export default async function DashboardPage() {
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
        <MySessionsSection sessions={mySessions} />
      </div>
    </main>
  );
}
