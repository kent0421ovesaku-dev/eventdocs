"use client";

import { useCallback, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { isAllowedFile } from "@/lib/fileUtils";

type FileUploadProps = {
  sessionId: string;
  side: "left" | "right";
  onUploadComplete: () => void;
  disabled?: boolean;
};

export default function FileUpload({
  sessionId,
  side,
  onUploadComplete,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!isAllowedFile(file.name)) {
        setError("対応形式：.xlsx, .xls, .docx, .pdf, .pptx, .ppt, .png, .jpg, .jpeg");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setError("Supabaseが未設定です");
          return;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${sessionId}/${side}/${safeName}`;
        console.log("[Upload] storage_path (形式: {session_id}/{side}/{filename}):", storagePath);

        const { error: uploadErr } = await supabase.storage
          .from("files")
          .upload(storagePath, file, { upsert: true });

        if (uploadErr) {
          setError(uploadErr.message);
          return;
        }

        const { data: existingFiles } = await supabase
          .from("files")
          .select("id")
          .eq("session_id", sessionId)
          .eq("side", side);

        await supabase
          .from("files")
          .update({ is_current: false })
          .eq("session_id", sessionId)
          .eq("side", side);

        const newVersion = (existingFiles?.length ?? 0) + 1;
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        const { error: insertErr } = await supabase.from("files").insert({
          session_id: sessionId,
          side,
          original_name: file.name,
          file_type: ext,
          storage_path: storagePath,
          version: newVersion,
          is_current: true,
        });

        if (insertErr) {
          setError(insertErr.message);
          return;
        }
        onUploadComplete();
      } catch (e) {
        setError(e instanceof Error ? e.message : "アップロードに失敗しました");
      } finally {
        setUploading(false);
      }
    },
    [sessionId, side, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [disabled, uploading, uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  return (
    <div className="p-2">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
          isDragging ? "border-accent bg-blue-50" : "border-gray-300 hover:border-gray-400"
        } ${disabled || uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.docx,.pdf,.pptx,.ppt,.png,.jpg,.jpeg"
          onChange={handleInputChange}
          disabled={disabled || uploading}
        />
        <span className="text-sm text-gray-600">
          {uploading ? "アップロード中…" : "ドラッグ＆ドロップ または クリックしてファイル選択"}
        </span>
        <br />
        <span className="text-xs text-gray-500">.xlsx, .xls, .docx, .pdf, .pptx, .ppt, .png, .jpg</span>
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
