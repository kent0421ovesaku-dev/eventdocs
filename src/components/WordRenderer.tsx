"use client";

import { useEffect, useRef, useState } from "react";

type WordRendererProps = {
  file: File;
  onTextExtracted?: (text: string) => void;
};

export default function WordRenderer({ file, onTextExtracted }: WordRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    const styleEl = styleRef.current;
    if (!el) {
      console.warn("WordRenderer: containerRef.current is null");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    file
      .arrayBuffer()
      .then(async (buf) => {
        if (cancelled) return;
        try {
          const { renderAsync } = await import("docx-preview");
          await renderAsync(buf, el, styleEl ?? undefined);
          if (!cancelled) {
            const text = el.innerText ?? el.textContent ?? "";
            onTextExtracted?.(text);
          }
          console.log("docx render complete");
        } catch (e) {
          console.error("docx render error:", e);
          if (!cancelled) setError(e instanceof Error ? e.message : "Wordの読み込みに失敗しました");
        }
      })
      .catch((e) => {
        console.error("WordRenderer fetch/load error:", e);
        if (!cancelled) setError(e instanceof Error ? e.message : "Wordの読み込みに失敗しました");
      })
      .finally(() => {
        if (!cancelled) {
          console.log("WordRenderer: loading set to false");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      el.innerHTML = "";
      if (styleEl) styleEl.innerHTML = "";
    };
  }, [file, onTextExtracted]);

  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4 bg-white relative">
      <div ref={styleRef} />
      <div ref={containerRef} className="docx-wrapper min-h-[200px]" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90">
          <p className="text-gray-500">読み込み中…</p>
        </div>
      )}
    </div>
  );
}
