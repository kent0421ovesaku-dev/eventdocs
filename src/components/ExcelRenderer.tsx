"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type ExcelRendererProps = {
  file: File;
  fileName: string;
  onTextExtracted?: (text: string) => void;
};

function sheetToPlainText(sheet: XLSX.WorkSheet): string {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const parts: string[] = [];
  for (let R = range.s.r; R <= range.e.r; R++) {
    const rowParts: string[] = [];
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
      const value = cell?.v != null ? String(cell.v) : "";
      rowParts.push(value);
    }
    parts.push(rowParts.join("\t"));
  }
  return parts.join("\n");
}

export default function ExcelRenderer({ file, onTextExtracted }: ExcelRendererProps) {
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    file
      .arrayBuffer()
      .then((buf) => {
        if (cancelled) return;
        try {
          const wb = XLSX.read(buf, { type: "array", cellStyles: true });
          const result = wb.SheetNames.map((name) => {
            const sheet = wb.Sheets[name];
            const html = sheetToHtml(sheet);
            return { name, html };
          });
          setSheets(result);
          setActiveIndex(0);
          const fullText = wb.SheetNames.map((name) => sheetToPlainText(wb.Sheets[name])).join("\n\n");
          onTextExtracted?.(fullText);
          console.log("Excel render complete, sheets:", result.length);
        } catch (e) {
          console.error("Excel render error:", e);
          if (!cancelled) setError(e instanceof Error ? e.message : "読み込みエラー");
        }
      })
      .catch((e) => {
        console.error("ExcelRenderer fetch/load error:", e);
        if (!cancelled) setError(e instanceof Error ? e.message : "読み込みエラー");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file, onTextExtracted]);

  if (loading) return <div className="p-4 text-gray-500">読み込み中…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (sheets.length === 0) return <div className="p-4 text-gray-500">シートがありません</div>;

  const current = sheets[activeIndex];
  return (
    <div className="flex flex-col h-full">
      {sheets.length > 1 && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-white">
          {sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(i);
              }}
              className={`px-2 py-1 rounded text-sm ${
                i === activeIndex ? "bg-accent text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <div
          className="inline-block min-w-full overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: current.html }}
        />
      </div>
    </div>
  );
}

function sheetToHtml(sheet: XLSX.WorkSheet): string {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  let html = '<table class="border border-gray-300 border-collapse" style="font-size: 12px;">';
  for (let R = range.s.r; R <= range.e.r; R++) {
    html += "<tr>";
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];
      if (!cell) {
        html += '<td class="border border-gray-300 p-1"></td>';
        continue;
      }
      const value = cell.v ?? "";
      const style = (cell as { s?: { fgColor?: { rgb?: string; theme?: number } } }).s;
      const bg = style?.fgColor?.rgb ? `background-color: ${style.fgColor.rgb}` : "";
      const border = "border: 1px solid #d1d5db";
      html += `<td class="border border-gray-300 p-1" style="${border};${bg}">${escapeHtml(String(value))}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";
  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
