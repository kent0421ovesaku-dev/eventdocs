"use client";

import { useState } from "react";
import type { DiffResult } from "@/lib/diffUtils";

interface DiffHighlightProps {
  result: DiffResult;
  onClose: () => void;
}

export default function DiffHighlight({ result, onClose }: DiffHighlightProps) {
  const { groups, summary } = result;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentGroup = groups[currentIndex];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── ヘッダー ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        {/* タイトル */}
        <span className="font-semibold text-gray-800 text-sm">🔍 差分検出結果</span>

        {/* サマリーバッジ */}
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          変更箇所 {summary.totalGroups}件
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          ＋{summary.added}行
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          −{summary.removed}行
        </span>

        {/* ナビゲーション */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← 前へ
            </button>
            <span className="text-xs text-gray-500 min-w-[60px] text-center">
              {currentIndex + 1} / {groups.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(groups.length - 1, i + 1))}
              disabled={currentIndex === groups.length - 1}
              className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              次へ →
            </button>
          </div>
        )}

        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-700 text-sm font-medium"
        >
          ✕
        </button>
      </div>

      {/* ── 本文 ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <span className="text-3xl">✅</span>
            <span className="text-sm">差分はありません（内容が同一です）</span>
          </div>
        ) : currentGroup ? (
          <div className="space-y-3">
            {/* 変更グループ番号 */}
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              変更箇所 #{currentGroup.id}
            </div>

            {/* コンテキスト（前後の文脈） */}
            {currentGroup.context.length > 0 && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
                <div className="px-3 py-1 bg-gray-100 text-xs text-gray-500 font-medium border-b border-gray-200">
                  前後の文脈
                </div>
                {currentGroup.context.map((line, i) => (
                  <div
                    key={i}
                    className="px-4 py-1.5 text-sm text-gray-500 leading-relaxed border-b border-gray-100 last:border-0"
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* 削除された行（旧バージョン） */}
            {currentGroup.removed.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 overflow-hidden">
                <div className="px-3 py-1 bg-red-100 text-xs text-red-600 font-semibold border-b border-red-200 flex items-center gap-1">
                  <span>−</span> 旧バージョン（削除）
                </div>
                {currentGroup.removed.map((line, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 text-sm text-red-800 leading-relaxed border-b border-red-100 last:border-0 bg-red-50"
                  >
                    <span className="text-red-400 mr-2 font-mono text-xs">−</span>
                    {line}
                  </div>
                ))}
              </div>
            )}

            {/* 追加された行（新バージョン） */}
            {currentGroup.added.length > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-200 overflow-hidden">
                <div className="px-3 py-1 bg-green-100 text-xs text-green-700 font-semibold border-b border-green-200 flex items-center gap-1">
                  <span>＋</span> 新バージョン（追加）
                </div>
                {currentGroup.added.map((line, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 text-sm text-green-900 leading-relaxed border-b border-green-100 last:border-0 bg-green-50"
                  >
                    <span className="text-green-500 mr-2 font-mono text-xs">＋</span>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── フッター（一覧表示） ── */}
      {groups.length > 1 && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex-shrink-0">
          <div className="flex gap-1 flex-wrap">
            {groups.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                  i === currentIndex
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {g.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
