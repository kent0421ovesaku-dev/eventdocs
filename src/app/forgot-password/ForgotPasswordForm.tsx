"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading && !info) handleSubmit();
  }

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      // NEXT_PUBLIC_SITE_URL が設定されていればそれを使い、なければ現在の origin にフォールバック
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const redirectTo = `${siteUrl}/auth/confirm`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );
      if (err) {
        setError("送信に失敗しました。メールアドレスをご確認いただくか、しばらくしてから再度お試しください。");
        return;
      }
      setInfo(
        "パスワード再設定メールを送信しました。メール内のリンクを開いてください。"
      );
    } catch {
      setError("接続に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          パスワードを忘れた方
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          登録済みのメールアドレスを入力してください。再設定リンクをお送りします。
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="fp-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メールアドレス
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading || !!info}
            />
          </div>

          {error && (
            <p
              className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2"
              role="alert"
            >
              {error}
            </p>
          )}
          {info && (
            <p
              className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded px-3 py-2"
              role="status"
            >
              {info}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !!info}
            className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "送信中…" : "再設定メールを送る"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            ログインに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
