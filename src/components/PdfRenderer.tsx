"use client";

import { useEffect, useRef } from "react";

// pdfjs-dist の TextItem に含まれる位置情報
type PdfTextItem = {
  str: string;
  transform: number[]; // [scaleX, shearX, shearY, scaleY, x, y]
  hasEOL?: boolean;
  width?: number;
};

/**
 * 1ページ分の TextItem[] から、位置情報を使って改行・スペースを挿入したテキストを生成する
 *
 * - y座標（transform[5]）が LINE_TOLERANCE より多く変化したら改行
 * - hasEOL=true のアイテムも改行の区切りとして扱う
 * - 同一行内で x座標のギャップが SPACE_THRESHOLD より大きければスペースを挿入
 */
function extractPageText(items: unknown[]): string {
  const textItems = items.filter((item): item is PdfTextItem => {
    if (!item || typeof item !== "object") return false;
    const t = item as Record<string, unknown>;
    return (
      typeof t.str === "string" &&
      Array.isArray(t.transform) &&
      (t.transform as number[]).length >= 6
    );
  });

  if (textItems.length === 0) return "";

  // PDF座標系はy軸が上向きなので、y降順（視覚的な上→下）・同一行内はx昇順でソート
  const sorted = [...textItems].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > LINE_TOLERANCE) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  const lines: string[] = [];
  let currentLineItems: PdfTextItem[] = [];
  let currentY: number | null = null;

  const flushLine = () => {
    if (currentLineItems.length > 0) {
      lines.push(buildLineText(currentLineItems));
      currentLineItems = [];
    }
  };

  for (const item of sorted) {
    const y = item.transform[5];

    if (currentY === null || Math.abs(y - currentY) > LINE_TOLERANCE) {
      flushLine();
      currentY = y;
    }

    currentLineItems.push(item);

    if (item.hasEOL) {
      flushLine();
      currentY = null;
    }
  }
  flushLine();

  return lines.filter((l) => l.trim() !== "").join("\n");
}

/** y座標の同一行判定しきい値（PDF単位） */
const LINE_TOLERANCE = 3;
/** スペース挿入するx座標ギャップのしきい値（PDF単位） */
const SPACE_THRESHOLD = 3;

/** 同一行のアイテムをx順に並べ、ギャップにスペースを挿入して結合する */
function buildLineText(items: PdfTextItem[]): string {
  const sorted = [...items].sort((a, b) => a.transform[4] - b.transform[4]);
  let result = "";
  let prevEnd: number | null = null;

  for (const item of sorted) {
    if (!item.str) continue;
    const x = item.transform[4];
    if (prevEnd !== null && x - prevEnd > SPACE_THRESHOLD) {
      result += " ";
    }
    result += item.str;
    prevEnd = x + (item.width ?? 0);
  }

  return result.trim();
}

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
          const pageText = extractPageText(content.items);
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

        // 全ページ append 後、ブラウザのレイアウト（reflow）が 2 フレーム以内に確定する
        // double rAF で scrollHeight が最終値になってから同期を再開する
        if (!cancelled) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!cancelled) onRenderCompleteRef.current?.();
            });
          });
        }
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
