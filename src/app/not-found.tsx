import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-10 text-center max-w-sm w-full">
        <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-lg font-bold text-gray-900 mb-2">ページが見つかりません</h1>
        <p className="text-sm text-gray-500 mb-8">
          URLが間違っているか、ページが削除された可能性があります。
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full bg-blue-500 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-600 transition text-center"
          >
            ダッシュボードへ戻る
          </Link>
          <Link
            href="/"
            className="w-full border border-gray-300 text-gray-700 rounded px-4 py-2 text-sm hover:bg-gray-50 transition text-center"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
