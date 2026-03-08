"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteSession } from "@/lib/actions";
import type { Session } from "@/lib/supabase";

type SessionListProps = {
  sessions: Session[];
};

export default function SessionList({ sessions }: SessionListProps) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("このセッションを削除しますか？")) return;
    const result = await deleteSession(sessionId);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  };

  if (sessions.length === 0) {
    return (
      <p className="text-gray-400 text-center py-8">まだセッションがありません</p>
    );
  }

  return (
    <ul>
      {sessions.map((s) => (
        <li
          key={s.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3"
        >
          <p className="font-medium text-gray-900 truncate">{s.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            {s.created_at
              ? new Date(s.created_at).toLocaleString("ja", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/session/${s.share_token}`}
              className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 transition"
            >
              開く
            </Link>
            <button
              type="button"
              onClick={(e) => handleDelete(e, s.id)}
              className="bg-white text-red-500 text-sm px-3 py-1 rounded border border-red-300 hover:bg-red-50 transition"
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
