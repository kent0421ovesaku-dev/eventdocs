"use client";

import { useState } from "react";

type CommentModalProps = {
  onSave: (commenterName: string, content: string) => void;
  onClose: () => void;
};

const SAVED_NAME_KEY = "commenter_name";

function getSavedName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SAVED_NAME_KEY) ?? "";
}

export default function CommentModal({
  onSave,
  onClose,
}: CommentModalProps) {
  const [name, setName] = useState(getSavedName);
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim() || "匿名";
    const c = content.trim();
    if (c) {
      onSave(n, c);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">コメントを追加</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="commenter-name" className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              id="commenter-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="匿名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
            />
          </div>
          <div>
            <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700 mb-1">
              コメント
            </label>
            <textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="コメントを入力..."
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
