import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ログイン | 資料比較・コメントサービス",
  description: "受託者向けログイン",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <LoginForm />
    </main>
  );
}
