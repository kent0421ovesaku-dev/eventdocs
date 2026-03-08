"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FileRecord, Comment } from "@/lib/supabase";
import FileUpload from "./FileUpload";
import FileRenderer from "./FileRenderer";
import PinComment from "./PinComment";

type FilePanelProps = {
  sessionId: string;
  side: "left" | "right";
  onScroll?: () => void;
  onTextExtracted?: (text: string) => void;
};

function useFileAndComments(sessionId: string, side: "left" | "right") {
  const [versions, setVersions] = useState<FileRecord[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const [filesRes, commentsRes] = await Promise.all([
      supabase
        .from("files")
        .select("*")
        .eq("session_id", sessionId)
        .eq("side", side)
        .order("version", { ascending: true }),
      supabase
        .from("comments")
        .select("*")
        .eq("session_id", sessionId)
        .eq("side", side)
        .order("created_at", { ascending: true }),
    ]);
    if (filesRes.data) setVersions(filesRes.data);
    else setVersions([]);
    if (commentsRes.data) setComments(commentsRes.data);
    else setComments([]);
  }, [sessionId, side]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { versions, comments, refresh };
}

function useRealtimeComments(sessionId: string, side: "left" | "right", refresh: () => Promise<void>) {
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel(`comments-${sessionId}-${side}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [sessionId, side, refresh]);
}

const FilePanel = forwardRef<HTMLDivElement, FilePanelProps>(function FilePanel(
  { sessionId, side, onScroll, onTextExtracted },
  ref
) {
  const { versions, comments, refresh } = useFileAndComments(sessionId, side);
  useRealtimeComments(sessionId, side, refresh);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fileContent, setFileContent] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const file =
    selectedFileId != null
      ? versions.find((v) => v.id === selectedFileId) ?? versions.find((v) => v.is_current) ?? versions[versions.length - 1]
      : versions.find((v) => v.is_current) ?? versions[versions.length - 1] ?? null;

  useEffect(() => {
    if (!file) setCurrentPage(1);
  }, [file]);

  useEffect(() => {
    if (!file || !fileContent) {
      onTextExtracted?.("");
    }
  }, [file, fileContent, onTextExtracted]);

  useEffect(() => {
    if (selectedFileId == null && versions.length > 0) {
      const current = versions.find((v) => v.is_current) ?? versions[versions.length - 1];
      if (current) setSelectedFileId(current.id);
    }
  }, [versions, selectedFileId]);

  // Supabase download()でファイル取得（CORS回避）→ Fileオブジェクトで保持
  useEffect(() => {
    if (!file || !supabase) {
      setFileContent(null);
      return;
    }
    let cancelled = false;
    supabase.storage
      .from("files")
      .download(file.storage_path)
      .then(({ data: blob, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("download error:", error);
          setFileContent(null);
          return;
        }
        if (!blob) {
          setFileContent(null);
          return;
        }
        const fileObj = new File([blob], file.original_name, { type: blob.type || "application/octet-stream" });
        setFileContent(fileObj);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleDownload = useCallback(async () => {
    if (!file || !supabase) return;
    setDownloadLoading(true);
    try {
      const { data: blob, error } = await supabase.storage.from("files").download(file.storage_path);
      if (error) throw error;
      if (!blob) throw new Error("ダウンロードに失敗しました");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.original_name;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloadLoading(false);
    }
  }, [file]);

  const [replaceLoading, setReplaceLoading] = useState(false);
  const handleReplaceFile = useCallback(async () => {
    if (!file || !supabase) return;
    const confirmReplace = window.confirm(
      "現在のファイルを削除して新しいファイルをアップロードしますか？"
    );
    if (!confirmReplace) return;

    const confirmComments = window.confirm(
      "このパネルのコメントも削除しますか？"
    );

    setReplaceLoading(true);
    try {
      await supabase.storage.from("files").remove([file.storage_path]);
      const { error: deleteError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);
      if (deleteError) throw deleteError;

      if (confirmComments) {
        await supabase
          .from("comments")
          .delete()
          .eq("session_id", sessionId)
          .eq("side", side);
      }
      await refresh();
    } catch (err) {
      console.error("ファイル差し替えエラー:", err);
      window.alert("ファイルの削除に失敗しました。");
    } finally {
      setReplaceLoading(false);
    }
  }, [file, sessionId, side, refresh]);

  const label = side === "left" ? "旧バージョン（左）" : "新バージョン（右）";

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0 p-2 border-b border-gray-200 bg-white/80 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-2">
            {file && (
              <>
                <button
                type="button"
                onClick={handleReplaceFile}
                disabled={replaceLoading}
                className="text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 px-2 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                ↺ ファイルを変更
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloadLoading}
                className="text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 px-2 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                ⬇ ダウンロード
              </button>
            </>
          )}
          </div>
        </div>
        {versions.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor={`version-select-${side}`} className="text-xs text-gray-500 shrink-0">
              バージョン:
            </label>
            <select
              id={`version-select-${side}`}
              value={file?.id ?? ""}
              onChange={(e) => setSelectedFileId(e.target.value || null)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white min-w-0 flex-1"
            >
              {versions.map((v, i) => (
                <option key={v.id} value={v.id}>
                  v{v.version ?? i + 1}: {v.original_name}
                  {v.is_current ? " (最新)" : ""}
                </option>
              ))}
            </select>
            {file?.is_current && (
              <span className="text-xs font-medium text-[#3B82F6] bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                最新
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <FileUpload sessionId={sessionId} side={side} onUploadComplete={refresh} />
        <div
          ref={ref}
          data-scroll-container
          className="flex-1 min-h-0 overflow-auto"
          onScroll={onScroll}
        >
          {file && fileContent ? (
            <PinComment
              sessionId={sessionId}
              side={side}
              comments={comments}
              onCommentsChange={refresh}
              currentPage={currentPage}
            >
              <FileRenderer
                file={fileContent}
                fileType={file.file_type}
                fileName={file.original_name}
                fileUrl={
                  (file.file_type === ".pptx" || file.file_type === ".ppt") && supabase
                    ? supabase.storage.from("files").getPublicUrl(file.storage_path).data.publicUrl
                    : undefined
                }
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onTextExtracted={onTextExtracted}
              />
            </PinComment>
          ) : file ? (
            <div className="p-4">
              <p className="text-gray-500 text-sm">読み込み中…</p>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-gray-500 text-sm">ファイルをアップロードしてください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default FilePanel;
