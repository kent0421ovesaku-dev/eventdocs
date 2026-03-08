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
};

function useFileAndComments(sessionId: string, side: "left" | "right") {
  const [file, setFile] = useState<FileRecord | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    // Step1: DBからstorage_pathを取得
    const [fileRes, commentsRes] = await Promise.all([
      supabase
        .from("files")
        .select("*")
        .eq("session_id", sessionId)
        .eq("side", side)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("comments")
        .select("*")
        .eq("session_id", sessionId)
        .eq("side", side)
        .order("created_at", { ascending: true }),
    ]);
    const fileData = fileRes.data;
    console.log("storage_path from DB:", fileData?.storage_path);
    if (fileData) {
      console.log("setFile called:", fileData);
      setFile(fileData);
    } else {
      setFile(null);
    }
    console.log("fetched comments:", commentsRes.data, "error:", commentsRes.error);
    if (commentsRes.data) setComments(commentsRes.data);
    else setComments([]);
    console.log("refresh complete");
  }, [sessionId, side]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { file, comments, refresh };
}

const FilePanel = forwardRef<HTMLDivElement, FilePanelProps>(function FilePanel(
  { sessionId, side, onScroll },
  ref
) {
  const { file, comments, refresh } = useFileAndComments(sessionId, side);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fileContent, setFileContent] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!file) setCurrentPage(1);
  }, [file]);

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
      <div className="flex-shrink-0 p-2 border-b border-gray-200 bg-white/80 flex items-center justify-between gap-2">
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
                currentPage={currentPage}
                onPageChange={setCurrentPage}
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
