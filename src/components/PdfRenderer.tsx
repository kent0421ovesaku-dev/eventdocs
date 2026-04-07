"use client";

import { useEffect, useRef } from "react";

interface PdfRendererProps {
  file: File;
  /** 後方互換のため維持（全ページ表示のため未使用） */
  currentPage?: number;
  /** 後方互換のため維持（全ページ表示のため未使用） */
  onPageChange?: (page: number) => void;
  onTextExtracted?: (text: string) => void;
  /** 描画開始時に呼ばれる（スクロール同期ゲート用） */
  onRenderStart?: () => void;
  /** 全ページ描画完了時に呼ばれる（スクロール同期ゲート用） */
  onRenderComplete?: () => void;
}

export default function PdfRenderer({ file, onTextExtracted, onRenderStart, onRenderComplete }: PdfRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // コールバックを ref で保持して useEffect の依存から外す
  const onTextExtractedRef = useRef(onTextExtracted);
  const onRenderStartRef = useRef(onRenderStart);
  const onRenderCompleteRef = useRef(onRenderComplete);
  useEffect(() => { onTextExtractedRef.current = onTextExtracted; }, [onTextExtracted]);
  useEffect(() => { onRenderStartRef.current = onRenderStart; }, [onRenderStart]);
  useEffect(() => { onRenderCompleteRef.current = onRenderComplete; }, [onRenderComplete]);

  useEffect(() => {
    if (!file) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    container.innerHTML = "";
    onRenderStartRef.current?.();

    const loadAndRender = async () => {
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

        // 全ページのテキストを抽出
        const textParts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const p = await pdf.getPage(i);
          const content = await p.getTextContent();
          const pageText = content.items
            .map((item: unknown) =>
              item && typeof item === "object" && "str" in item
                ? String((item as { str?: string }).str ?? "")
                : ""
            )
            .join("");
          textParts.push(pageText);
        }
        if (!cancelled) onTextExtractedRef.current?.(textParts.join("\n\n"));

        // 全ページを順番に canvas に描画して縦並べ
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.maxWidth = "100%";
          canvas.style.display = "block";

          // ページ間の区切り
          const wrapper = document.createElement("div");
          wrapper.style.marginBottom = "12px";
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);

          const context = canvas.getContext("2d");
          if (!context || cancelled) return;

          const renderTask = page.render({ canvasContext: context, viewport });
          try {
            await renderTask.promise;
          } catch (e: unknown) {
            if (
              e &&
              typeof e === "object" &&
              "name" in e &&
              e.name === "RenderingCancelledException"
            )
              return;
            throw e;
          }
        }

        if (!cancelled) onRenderCompleteRef.current?.();
      } catch (e: unknown) {
        if (
          e &&
          typeof e === "object" &&
          "name" in e &&
          e.name === "RenderingCancelledException"
        )
          return;
        console.error("PDF render error:", e);
        if (!cancelled) {
          container.innerHTML =
            '<p class="text-red-500 p-4">PDFの表示に失敗しました</p>';
        }
      }
    };

    loadAndRender();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [file]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full p-4"
    />
  );
}
