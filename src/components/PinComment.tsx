"use client";

import { useCallback, useState } from "react";
import CommentModal from "./CommentModal";
import { getSupabase, type Comment } from "@/lib/supabase";

type PinCommentProps = {
  sessionId: string;
  side: "left" | "right";
  comments: Comment[];
  onCommentsChange: () => void | Promise<void>;
  currentPage?: number;
  children: React.ReactNode;
};

export default function PinComment({
  sessionId,
  side,
  comments,
  onCommentsChange,
  currentPage = 1,
  children,
}: PinCommentProps) {
  const [modal, setModal] = useState<{ x: number; y: number } | null>(null);
  const [popup, setPopup] = useState<Comment | null>(null);

  const visibleComments = comments.filter(
    (c) => Number(c.page_number ?? 1) === Number(currentPage)
  );

  const handleToggleResolved = useCallback(
    async (comment: Comment) => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { error } = await supabase
        .from("comments")
        .update({ is_resolved: !comment.is_resolved })
        .eq("id", comment.id);
      if (error) {
        console.error("Comment resolve toggle failed:", error);
        return;
      }
      await onCommentsChange();
    },
    [onCommentsChange]
  );

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target.closest("[data-pin-marker]") || target.closest("[data-comment-popup]")) return;
      const container = e.currentTarget;
      const scrollContainer =
        (container.closest("[data-scroll-container]") as HTMLElement | null) || container;
      const rect = scrollContainer.getBoundingClientRect();
      const scrollLeft = scrollContainer.scrollLeft;
      const scrollTop = scrollContainer.scrollTop;
      const xPercent =
        scrollContainer.scrollWidth > 0
          ? ((e.clientX - rect.left + scrollLeft) / scrollContainer.scrollWidth) * 100
          : 0;
      const yPercent =
        scrollContainer.scrollHeight > 0
          ? ((e.clientY - rect.top + scrollTop) / scrollContainer.scrollHeight) * 100
          : 0;
      setModal({ x: xPercent, y: yPercent });
    },
    []
  );

  const handleSaveComment = useCallback(
    async (commenterName: string, content: string) => {
      if (!modal) return;
      const supabase = getSupabase();
      if (!supabase) return;
      console.log("saving comment:", {
        session_id: sessionId,
        side,
        x_percent: modal.x,
        y_percent: modal.y,
        commenter_name: commenterName,
        content,
        page_number: currentPage,
      });
      const { data, error } = await supabase.from("comments").insert({
        session_id: sessionId,
        side,
        x_percent: modal.x,
        y_percent: modal.y,
        commenter_name: commenterName,
        content,
        page_number: currentPage,
      });
      console.log("insert result:", { data, error });
      if (error) {
        console.error("Comment insert failed:", error.message, error.details);
        return;
      }
      setModal(null);
      await onCommentsChange();
    },
    [sessionId, side, modal, currentPage, onCommentsChange]
  );

  return (
    <div
      className="relative block min-w-full"
      onClick={handleContentClick}
      role="presentation"
    >
      <div className="relative inline-block min-w-full">
        {children}
        <div className="absolute inset-0 pointer-events-none">
          {visibleComments.map((c, i) => (
            <button
              key={c.id}
              type="button"
              data-pin-marker
              className={`absolute w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow cursor-pointer hover:scale-110 transition-transform z-10 pointer-events-auto ${
                c.is_resolved ? "opacity-60" : ""
              }`}
              style={{
                left: `${c.x_percent}%`,
                top: `${c.y_percent}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: c.is_resolved ? "#9CA3AF" : "#3B82F6",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setPopup(popup?.id === c.id ? null : c);
              }}
            >
              {i + 1}
            </button>
          ))}
          {popup && (
            <div
              data-comment-popup
              className="absolute z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs pointer-events-auto"
              style={{
                left: `${popup.x_percent}%`,
                top: `${popup.y_percent}%`,
                transform: "translate(-50%, -100%)",
                marginTop: "-8px",
              }}
            >
              <p className="font-medium text-gray-900 text-sm">{popup.commenter_name}</p>
              <p className="text-gray-600 text-sm mt-1">{popup.content}</p>
              <p className="text-gray-400 text-xs mt-2">
                {new Date(popup.created_at).toLocaleString("ja")}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleResolved(popup);
                  }}
                  className={
                    popup.is_resolved
                      ? "px-2 py-1 text-xs font-medium rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
                      : "px-2 py-1 text-xs font-medium rounded bg-green-500 text-white hover:bg-green-600"
                  }
                >
                  {popup.is_resolved ? "↩ 未解決に戻す" : "✓ 解決済みにする"}
                </button>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopup(null);
                }}
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      {modal && (
        <CommentModal
          onSave={handleSaveComment}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
