"use client";

import { useState } from "react";

type NameModalProps = {
  onSubmit: (name: string) => void;
};

export default function NameModal({ onSubmit }: NameModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 id="name-modal-title" className="text-lg font-semibold text-gray-900 mb-1">
          あなたの名前を入力してください
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          コメント投稿時に使用されます。後から変更可能です。
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name-modal-input" className="sr-only">
              名前
            </label>
            <input
              id="name-modal-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：田中 太郎"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] outline-none"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2.5 px-4 text-white font-medium rounded-lg bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 transition"
          >
            はじめる
          </button>
        </form>
      </div>
    </div>
  );
}
