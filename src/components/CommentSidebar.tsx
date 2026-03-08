"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/lib/supabase";

type CommentSidebarProps = {
  sessionId: string;
  open: boolean;
  onToggle: () => void;
};

export default function CommentSidebar({
  sessionId,
  open,
  onToggle,
}: CommentSidebarProps) {
  const [comments, setComments] = useState<Comment[]>([]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("CommentSidebar fetch error:", error);
      return;
    }
    setComments(data ?? []);
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // サイドバーを開いたときに再取得（左右両パネルの最新コメントを表示）
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="flex-shrink-0 px-2 py-2 border-l border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
        title={open ? "コメント一覧を閉じる" : "コメント一覧を開く"}
      >
        {open ? "→" : "←"} コメント
      </button>
      {open && (
        <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white overflow-auto flex flex-col">
          <div className="p-2 border-b border-gray-200 flex items-center justify-between gap-2">
            <span className="font-medium text-gray-900 text-sm">コメント一覧（左右両方）</span>
            <button
              type="button"
              onClick={() => refresh()}
              className="text-xs text-accent hover:underline"
            >
              更新
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-3">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm">コメントはまだありません</p>
            ) : (
              comments.map((c, i) => (
                <div
                  key={c.id}
                  className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm"
                >
                  <div className="flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900">{c.commenter_name}</span>
                    <span className="text-gray-400 text-xs">
                      {c.side === "left" ? "左" : "右"}
                      {(c.page_number ?? 1) > 1 && ` p.${c.page_number}`}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1 break-words">{c.content}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(c.created_at).toLocaleString("ja")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
