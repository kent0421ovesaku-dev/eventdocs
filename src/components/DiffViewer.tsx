"use client";

import { useCallback, useRef, useState } from "react";
import Resizer from "./Resizer";
import FilePanel from "./FilePanel";
import CommentSidebar from "./CommentSidebar";

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

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

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
          />
        </div>

        <CommentSidebar
          sessionId={sessionId}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((o) => !o)}
        />
      </div>
    </div>
  );
}
