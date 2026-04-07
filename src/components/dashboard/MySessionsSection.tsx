"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@/lib/supabase";

type Props = {
  sessions: Session[];
};

export default function MySessionsSection({ sessions: initialSessions }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
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
                  <Link
                    href={`/session/${s.share_token}`}
                    className="flex-1 text-blue-600 hover:underline text-sm truncate"
                  >
                    {s.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    className="text-xs text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="セッション名を編集"
                  >
                    ✏️
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
