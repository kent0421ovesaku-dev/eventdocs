"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ExcelRenderer = dynamic(() => import("./ExcelRenderer"), { ssr: false });
const WordRenderer = dynamic(() => import("./WordRenderer"), { ssr: false });
const PdfRenderer = dynamic(() => import("./PdfRenderer"), { ssr: false });

type FileRendererProps = {
  file: File;
  fileType: string;
  fileName: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
};

export default function FileRenderer({ file, fileType, fileName, currentPage = 1, onPageChange }: FileRendererProps) {
  const ext = fileType.toLowerCase().replace(/^\./, "");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (ext !== "png" && ext !== "jpg" && ext !== "jpeg") return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, ext]);

  if (ext === "xlsx" || ext === "xls") {
    return <ExcelRenderer file={file} fileName={fileName} />;
  }
  if (ext === "docx") {
    return <WordRenderer file={file} />;
  }
  if (ext === "pdf") {
    return (
      <PdfRenderer
        file={file}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    );
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg") {
    if (!objectUrl) return <div className="p-4 text-gray-500">読み込み中…</div>;
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={objectUrl} alt={fileName} className="max-w-full max-h-[80vh] object-contain" />
      </div>
    );
  }

  return (
    <div className="p-4 text-gray-500">
      未対応の形式です: {fileType}
    </div>
  );
}
