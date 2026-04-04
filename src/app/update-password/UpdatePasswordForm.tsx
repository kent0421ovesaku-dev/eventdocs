"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ErrorContent = { text: string; linkHref?: string; linkLabel?: string };

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<ErrorContent | null>(null);
  const [loading, setLoading] = useState(false);

  // URL hash に #error=... &error_description=... が含まれる場合（旧 implicit フロー）に表示
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const desc = params.get("error_description") ?? params.get("error");
    if (desc) {
      setError({
        text: "再設定リンクが無効または期限切れです。",
        linkHref: "/forgot-password",
        linkLabel: "再度手続きする",
      });
    }
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading) handleSubmit();
  }

  async function handleSubmit() {
    setError(null);
    if (!password) {
      setError({ text: "新しいパスワードを入力してください。" });
      return;
    }
    if (password.length < 6) {
      setError({ text: "パスワードは6文字以上で入力してください。" });
      return;
    }
    if (password !== confirm) {
      setError({ text: "パスワードが一致しません。" });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError({
          text: "パスワードの更新に失敗しました。リンクの有効期限が切れている場合は再度手続きしてください。",
          linkHref: "/forgot-password",
          linkLabel: "パスワードを忘れた方はこちら",
        });
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError({ text: "接続に失敗しました。しばらくしてから再度お試しください。" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          新しいパスワードを設定
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          新しいパスワードを入力してください。
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="up-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              新しいパスワード
            </label>
            <input
              id="up-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="up-confirm"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              パスワード（確認）
            </label>
            <input
              id="up-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          {error && (
            <p
              className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2"
              role="alert"
            >
              {error.text}
              {error.linkHref && (
                <>
                  {" "}
                  <Link href={error.linkHref} className="underline hover:text-red-800">
                    {error.linkLabel}
                  </Link>
                </>
              )}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "更新中…" : "パスワードを更新する"}
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
