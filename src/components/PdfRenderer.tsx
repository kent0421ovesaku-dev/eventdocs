"use client";

import { useEffect, useRef, useState } from "react";

interface PdfRendererProps {
  file: File;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export default function PdfRenderer({ file, currentPage: controlledPage, onPageChange }: PdfRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = onPageChange && controlledPage !== undefined ? controlledPage : internalPage;
  const setCurrentPage = onPageChange && controlledPage !== undefined ? onPageChange : setInternalPage;
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          useWorkerFetch: false,
          isEvalSupported: false,
        }).promise;

        if (cancelled) return;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTaskRef.current.promise;
      } catch (e: unknown) {
        if (e && typeof e === "object" && "name" in e && e.name === "RenderingCancelledException") return;
        console.error("PDF render error:", e);
        setError("PDFの表示に失敗しました");
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [file, currentPage]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="flex flex-col items-center w-full p-4">
      <canvas ref={canvasRef} style={{ maxWidth: "100%", display: "block" }} />
      {numPages > 1 && (
        <div className="flex gap-2 mt-2 items-center">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-accent text-white rounded disabled:opacity-50 hover:bg-blue-600"
          >
            前へ
          </button>
          <span className="text-sm">
            {currentPage} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="px-3 py-1 bg-accent text-white rounded disabled:opacity-50 hover:bg-blue-600"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
