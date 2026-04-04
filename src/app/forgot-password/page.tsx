import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "パスワードを忘れた方 | 資料比較・コメントサービス",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <ForgotPasswordForm />
    </main>
  );
}
