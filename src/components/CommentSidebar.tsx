"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/lib/supabase";

type FilterTab = "all" | "unresolved" | "resolved";

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
  const [filter, setFilter] = useState<FilterTab>("unresolved");

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

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const filteredComments =
    filter === "all"
      ? comments
      : filter === "resolved"
        ? comments.filter((c) => c.is_resolved)
        : comments.filter((c) => !c.is_resolved);

  const handleToggleResolved = useCallback(
    async (comment: Comment) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("comments")
        .update({ is_resolved: !comment.is_resolved })
        .eq("id", comment.id);
      if (error) {
        console.error("Comment resolve toggle failed:", error);
        return;
      }
      await refresh();
    },
    [refresh]
  );

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
              className="text-xs text-[#3B82F6] hover:underline"
            >
              更新
            </button>
          </div>
          <div className="flex border-b border-gray-200">
            {(["unresolved", "resolved", "all"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`flex-1 py-2 text-xs font-medium border-b-2 transition ${
                  filter === tab
                    ? "border-[#3B82F6] text-[#3B82F6]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "all" ? "すべて" : tab === "unresolved" ? "未解決" : "解決済み"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-3">
            {filteredComments.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {filter === "all"
                  ? "コメントはまだありません"
                  : filter === "resolved"
                    ? "解決済みのコメントはありません"
                    : "未解決のコメントはありません"}
              </p>
            ) : (
              filteredComments.map((c, i) => (
                <div
                  key={c.id}
                  className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm"
                >
                  <div className="flex items-center gap-1 flex-wrap">
                    <span
                      className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0"
                      style={{
                        backgroundColor: c.is_resolved ? "#9CA3AF" : "#3B82F6",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900">{c.commenter_name}</span>
                    <span className="text-gray-400 text-xs">
                      {c.side === "left" ? "左" : "右"}
                      {(c.page_number ?? 1) > 1 && ` p.${c.page_number}`}
                    </span>
                    <span
                      className={`text-xs ${
                        c.is_resolved ? "text-gray-500" : "text-[#3B82F6]"
                      }`}
                    >
                      {c.is_resolved ? "✓ 解決済み" : "● 未解決"}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1 break-words">{c.content}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(c.created_at).toLocaleString("ja")}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleToggleResolved(c)}
                    className={
                      c.is_resolved
                        ? "mt-2 px-2 py-1 text-xs font-medium rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
                        : "mt-2 px-2 py-1 text-xs font-medium rounded bg-green-500 text-white hover:bg-green-600"
                    }
                  >
                    {c.is_resolved ? "↩ 未解決に戻す" : "✓ 解決済みにする"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
