"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FileRecord, Comment } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import FileUpload from "./FileUpload";
import FileRenderer from "./FileRenderer";
import PinComment from "./PinComment";

async function fetchBlobViaSignedUrl(
  storagePath: string,
  shareToken: string
): Promise<{ ok: true; blob: Blob; signedUrl: string } | { ok: false }> {
  const params = new URLSearchParams({
    storage_path: storagePath,
    share_token: shareToken,
  });
  const metaRes = await fetch(`/api/storage/signed-url?${params.toString()}`);
  if (!metaRes.ok) return { ok: false };
  const body = (await metaRes.json()) as { signedUrl?: string };
  if (!body.signedUrl) return { ok: false };
  const fileRes = await fetch(body.signedUrl);
  if (!fileRes.ok) return { ok: false };
  const blob = await fileRes.blob();
  return { ok: true, blob, signedUrl: body.signedUrl };
}

type FilePanelProps = {
  sessionId: string;
  shareToken: string;
  side: "left" | "right";
  onScroll?: () => void;
  onTextExtracted?: (text: string) => void;
  onRenderStart?: () => void;
  onRenderComplete?: () => void;
};

function useFileAndComments(sessionId: string, shareToken: string, side: "left" | "right") {
  const [versions, setVersions] = useState<FileRecord[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const refresh = useCallback(async () => {
    // files は Route Handler 経由で取得（anon による broad SELECT を回避）
    const filesPromise = fetch(
      `/api/session/${encodeURIComponent(shareToken)}/files?side=${side}`
    ).then(async (res) => {
      if (!res.ok) return { data: null };
      const json = await res.json() as { files?: FileRecord[] };
      return { data: json.files ?? null };
    });

    // comments も Route Handler 経由で取得（anon による broad SELECT を回避）
    const commentsPromise = fetch(
      `/api/session/${encodeURIComponent(shareToken)}/comments?side=${side}`
    ).then(async (res) => {
      if (!res.ok) return { data: null };
      const json = await res.json() as { comments?: Comment[] };
      return { data: json.comments ?? null };
    });

    const [filesRes, commentsRes] = await Promise.all([filesPromise, commentsPromise]);
    if (filesRes.data) setVersions(filesRes.data);
    else setVersions([]);
    if (commentsRes.data) setComments(commentsRes.data);
    else setComments([]);
  }, [sessionId, shareToken, side]);

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
  { sessionId, shareToken, side, onScroll, onTextExtracted, onRenderStart, onRenderComplete },
  ref
) {
  const { versions, comments, refresh } = useFileAndComments(sessionId, shareToken, side);
  useRealtimeComments(sessionId, side, refresh);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [fileContent, setFileContent] = useState<File | null>(null);
  /** PPT/PPTX の Google ビューア用（署名付き URL。blob の Object URL では外部ビューアが読めない） */
  const [pptViewerSignedUrl, setPptViewerSignedUrl] = useState<string | undefined>(undefined);
  const [fileLoadError, setFileLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setIsOwner(!!data.user));
  }, []);

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

  // 署名付き URL（Route Handler 発行）→ fetch で blob 取得 → File として保持
  useEffect(() => {
    if (!file) {
      setFileContent(null);
      setPptViewerSignedUrl(undefined);
      setFileLoadError(false);
      return;
    }
    let cancelled = false;
    setFileLoadError(false);
    setPptViewerSignedUrl(undefined);
    void fetchBlobViaSignedUrl(file.storage_path, shareToken).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        console.error("signed-url / fetch blob failed");
        setFileContent(null);
        setFileLoadError(true);
        return;
      }
      const fileObj = new File([result.blob], file.original_name, {
        type: result.blob.type || "application/octet-stream",
      });
      setFileContent(fileObj);
      const isPpt = file.file_type === ".pptx" || file.file_type === ".ppt";
      setPptViewerSignedUrl(isPpt ? result.signedUrl : undefined);
    });
    return () => {
      cancelled = true;
    };
  // retryCount を依存に含めることで「再読み込み」ボタンが useEffect を再実行できる
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, shareToken, retryCount]);

  const handleDownload = useCallback(async () => {
    if (!file) return;
    setDownloadLoading(true);
    try {
      const result = await fetchBlobViaSignedUrl(file.storage_path, shareToken);
      if (!result.ok) throw new Error("ダウンロードに失敗しました");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(result.blob);
      a.download = file.original_name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.alert("ダウンロードに失敗しました。");
    } finally {
      setDownloadLoading(false);
    }
  }, [file, shareToken]);

  const [replaceLoading, setReplaceLoading] = useState(false);
  const handleReplaceFile = useCallback(async () => {
    if (!file) return;
    const confirmReplace = window.confirm(
      "現在のファイルを削除して新しいファイルをアップロードしますか？"
    );
    if (!confirmReplace) return;

    const confirmComments = window.confirm(
      "このパネルのコメントも削除しますか？"
    );

    setReplaceLoading(true);
    try {
      // createClient（auth Cookie 付き）で実行し、migration 後の owner-only RLS に対応
      const authClient = createClient();
      await authClient.storage.from("files").remove([file.storage_path]);
      const { error: deleteError } = await authClient
        .from("files")
        .delete()
        .eq("id", file.id);
      if (deleteError) throw deleteError;

      if (confirmComments) {
        await authClient
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
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleReplaceFile}
                    disabled={replaceLoading}
                    className="text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 px-2 py-1 rounded border border-gray-300 disabled:opacity-50"
                  >
                    ↺ ファイルを変更
                  </button>
                )}
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
          {fileLoadError ? (
            <div className="p-4 flex flex-col items-start gap-2">
              <p className="text-sm text-red-600">ファイルの読み込みに失敗しました。再度お試しください。</p>
              <button
                type="button"
                onClick={() => { setFileLoadError(false); setRetryCount((c) => c + 1); }}
                className="text-sm text-blue-600 hover:underline"
              >
                再読み込み
              </button>
            </div>
          ) : file && fileContent ? (
            <PinComment
              sessionId={sessionId}
              shareToken={shareToken}
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
                  (file.file_type === ".pptx" || file.file_type === ".ppt")
                    ? pptViewerSignedUrl
                    : undefined
                }
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onTextExtracted={onTextExtracted}
                onRenderStart={onRenderStart}
                onRenderComplete={onRenderComplete}
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
