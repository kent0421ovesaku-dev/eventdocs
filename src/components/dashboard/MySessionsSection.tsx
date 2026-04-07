"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@/lib/supabase";

type Props = {
  sessions: Session[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export default function MySessionsSection({ sessions: initialSessions }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(session: Session) {
    setEditingId(session.id);
    setEditValue(session.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveEdit(session: Session) {
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    if (trimmed === session.title) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sessions")
        .update({ title: trimmed })
        .eq("id", session.id);
      if (!error) {
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id ? { ...s, title: trimmed } : s))
        );
      }
    } catch {
      // 保存失敗時は元の名前のまま
    } finally {
      setSaving(false);
      cancelEdit();
    }
  }

  async function deleteSession(session: Session) {
    if (!window.confirm(`「${session.title}」を削除しますか？\nこの操作は取り消せません。`)) return;
    setDeletingId(session.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", session.id);
      if (!error) {
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
      }
    } catch {
      // 削除失敗時は何もしない
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">あなたのセッション一覧</h2>
      {sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
          <p className="mb-2">まだ表示するセッションがありません。</p>
          <p>上のボタンから新しいセッションを作成できます。</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-2 group">
              {editingId === s.id ? (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveEdit(s); }
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onBlur={() => saveEdit(s)}
                    disabled={saving}
                    autoFocus
                    className="flex-1 border border-blue-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cancelEdit}
                    className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  {/* セッション名 + 日付 */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/session/${s.share_token}`}
                      className="text-blue-600 hover:underline text-sm truncate block"
                    >
                      {s.title}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {formatDate(s.created_at)}
                    </span>
                  </div>

                  {/* 名前変更ボタン */}
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    className="text-xs text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:underline"
                  >
                    名前を変更
                  </button>

                  {/* 削除ボタン */}
                  <button
                    type="button"
                    onClick={() => deleteSession(s)}
                    disabled={deletingId === s.id}
                    className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 disabled:opacity-30"
                    title="削除"
                  >
                    {deletingId === s.id ? "削除中…" : "削除"}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
