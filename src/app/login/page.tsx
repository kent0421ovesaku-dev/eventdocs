import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ログイン | 資料比較・コメントサービス",
  description: "受託者向けログイン",
};

const URL_ERROR_MAP: Record<string, string> = {
  invalid_code: "パスワード再設定リンクの有効期限が切れているか、無効なリンクです。再度お試しください。",
  missing_code: "パスワード再設定リンクが不正です。再度お試しください。",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function LoginPage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const errorKey = typeof searchParams.error === "string" ? searchParams.error : undefined;
  const urlError = errorKey ? (URL_ERROR_MAP[errorKey] ?? "認証エラーが発生しました。再度お試しください。") : undefined;
  const loggedOut = searchParams.logged_out === "1";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <LoginForm urlError={urlError} loggedOut={loggedOut} />
    </main>
  );
}
