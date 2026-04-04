"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "このメールアドレスは既に登録されています。ログインしてください。";
  }
  if (m.includes("password") && m.includes("least")) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (m.includes("invalid email")) {
    return "メールアドレスの形式が正しくありません。";
  }
  if (m.includes("email rate limit") || m.includes("too many requests")) {
    return "試行回数が多すぎます。しばらくしてから再度お試しください。";
  }
  return "ログインに失敗しました。入力内容をご確認ください。";
}

function validateLogin(email: string, password: string): string | null {
  if (!email.trim()) return "メールアドレスを入力してください。";
  if (!password) return "パスワードを入力してください。";
  return null;
}

function validateSignUp(email: string, password: string): string | null {
  if (!email.trim()) return "メールアドレスを入力してください。";
  if (!password) return "パスワードを入力してください。";
  if (password.length < 6) return "パスワードは6文字以上で入力してください。";
  return null;
}

export default function LoginForm({ urlError, loggedOut }: { urlError?: string; loggedOut?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError ?? null);
  const [info, setInfo] = useState<string | null>(loggedOut ? "ログアウトしました。" : null);
  const [loading, setLoading] = useState(false);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading) handleLogin();
  }

  async function handleLogin() {
    setError(null);
    setInfo(null);
    const v = validateLogin(email, password);
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(mapAuthError(err.message));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("接続に失敗しました。環境変数やネットワークをご確認ください。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setError(null);
    setInfo(null);
    const v = validateSignUp(email, password);
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(mapAuthError(err.message));
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setInfo(
          "確認メールを送信しました。メール内のリンクを開いたうえで、ログインしてください。"
        );
      }
    } catch {
      setError("登録に失敗しました。環境変数やネットワークをご確認ください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">受託者ログイン</h1>
        <p className="text-gray-600 text-sm mb-6">
          メールアドレスとパスワードでログイン、または新規登録できます。
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded px-3 py-2" role="status">
              {info}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition disabled:opacity-50"
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 border border-blue-500 text-blue-600 rounded px-4 py-2 hover:bg-blue-50 transition disabled:opacity-50"
            >
              新規登録
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 pt-1">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              パスワードを忘れた方
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-blue-600 hover:underline">
            トップに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
