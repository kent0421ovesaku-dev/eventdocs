import type { Metadata } from "next";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const metadata: Metadata = {
  title: "パスワード再設定 | 資料比較・コメントサービス",
};

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <UpdatePasswordForm />
    </main>
  );
}
