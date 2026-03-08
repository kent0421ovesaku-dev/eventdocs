"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Resizer from "./Resizer";
import FilePanel from "./FilePanel";
import CommentSidebar from "./CommentSidebar";
import DiffHighlight from "./DiffHighlight";
import type { DiffResult } from "@/lib/diffUtils";

type DiffViewerProps = {
  sessionId: string;
  shareToken: string;
  title: string;
  displayName?: string | null;
  onRequestNameChange?: () => void;
};

export default function DiffViewer({ sessionId, shareToken, title, displayName, onRequestNameChange }: DiffViewerProps) {
  const [leftPercent, setLeftPercent] = useState(50);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [leftText, setLeftText] = useState<string>("");
  const [rightText, setRightText] = useState<string>("");
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const diffPanelRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (diffResult) {
      diffPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [diffResult]);

  const handleDetectDiff = useCallback(async () => {
    const left = leftText.trim();
    const right = rightText.trim();
    if (!left || !right) {
      window.alert("両パネルにテキストファイル（Excel・Word・PDF）をアップロードしてください");
      return;
    }
    setDiffLoading(true);
    setDiffResult(null);
    try {
      const response = await fetch("/api/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leftText: left, rightText: right }),
      });
      if (!response.ok) throw new Error("差分検出に失敗しました");
      const result = await response.json();
      setDiffResult(result);
    } catch (error) {
      console.error("Diff detection error:", error);
      window.alert("差分検出中にエラーが発生しました");
    } finally {
      setDiffLoading(false);
    }
  }, [leftText, rightText]);

  const handleLeftScroll = useCallback(() => {
    if (!syncScroll || isSyncing.current) return;
    isSyncing.current = true;
    const left = leftPanelRef.current;
    const right = rightPanelRef.current;
    if (left && right) {
      const maxScroll = left.scrollHeight - left.clientHeight;
      const ratio = maxScroll > 0 ? left.scrollTop / maxScroll : 0;
      const rightMax = right.scrollHeight - right.clientHeight;
      right.scrollTop = ratio * rightMax;
    }
    window.setTimeout(() => {
      isSyncing.current = false;
    }, 50);
  }, [syncScroll]);

  const handleRightScroll = useCallback(() => {
    if (!syncScroll || isSyncing.current) return;
    isSyncing.current = true;
    const left = leftPanelRef.current;
    const right = rightPanelRef.current;
    if (left && right) {
      const maxScroll = right.scrollHeight - right.clientHeight;
      const ratio = maxScroll > 0 ? right.scrollTop / maxScroll : 0;
      const leftMax = left.scrollHeight - left.clientHeight;
      left.scrollTop = ratio * leftMax;
    }
    window.setTimeout(() => {
      isSyncing.current = false;
    }, 50);
  }, [syncScroll]);

  const copyUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/session/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setUrlCopied(true);
      window.setTimeout(() => setUrlCopied(false), 2000);
    });
  }, [shareToken]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex-shrink-0 h-12 px-4 flex items-center justify-between gap-2 border-b border-gray-200 bg-white">
        <h1 className="font-semibold text-gray-900 truncate min-w-0">{title}</h1>
        <button
          type="button"
          onClick={handleDetectDiff}
          disabled={diffLoading}
          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
        >
          {diffLoading ? (
            <>
              <span className="animate-spin">⏳</span> 検出中...
            </>
          ) : (
            <>🔍 差分を検出</>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSyncScroll((s) => !s)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition shrink-0 ${
            syncScroll
              ? "bg-[#3B82F6] text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {syncScroll ? "🔗 同期スクロール ON" : "同期スクロール OFF"}
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {displayName && (
            <span className="text-sm text-gray-600 truncate max-w-[120px]" title={displayName}>
              {displayName}
            </span>
          )}
          {onRequestNameChange && (
            <button
              type="button"
              onClick={onRequestNameChange}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
            >
              {displayName ? "変更" : "名前を入力"}
            </button>
          )}
          <button
            type="button"
            onClick={copyUrl}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition text-[#3B82F6] hover:bg-blue-50"
          >
            {urlCopied ? "コピーしました！✓" : "URLをコピー"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div
          className="flex-shrink-0 bg-panel-bg overflow-hidden flex flex-col min-h-0"
          style={{ width: `${leftPercent}%` }}
        >
          <FilePanel
            ref={leftPanelRef}
            sessionId={sessionId}
            side="left"
            onScroll={handleLeftScroll}
            onTextExtracted={setLeftText}
          />
        </div>

        <Resizer leftPercent={leftPercent} onResize={setLeftPercent} />

        <div
          className="flex-1 bg-panel-bg overflow-hidden flex flex-col min-h-0"
          style={{ width: `${100 - leftPercent}%` }}
        >
          <FilePanel
            ref={rightPanelRef}
            sessionId={sessionId}
            side="right"
            onScroll={handleRightScroll}
            onTextExtracted={setRightText}
          />
        </div>

        <CommentSidebar
          sessionId={sessionId}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((o) => !o)}
        />
      </div>

      {diffResult && (
        <div
          ref={diffPanelRef}
          className="border-t border-gray-200 h-64 bg-white flex-shrink-0 flex flex-col min-h-0"
        >
          <DiffHighlight
            result={diffResult}
            onClose={() => setDiffResult(null)}
          />
        </div>
      )}
    </div>
  );
}
