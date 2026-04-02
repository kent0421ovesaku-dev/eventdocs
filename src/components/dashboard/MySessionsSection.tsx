import Link from "next/link";
import type { Session } from "@/lib/supabase";

type Props = {
  /** 将来: サーバーで user_id により絞った一覧を渡す */
  sessions: Session[];
};

export default function MySessionsSection({ sessions }: Props) {
  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">あなたのセッション一覧</h2>
      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
          <p className="mb-2">まだ表示するセッションがありません。</p>
          <p>
            比較の作成・全件一覧は{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              トップページ
            </Link>
            から行えます。
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/session/${s.share_token}`}
                className="text-blue-600 hover:underline"
              >
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
