"use client";

import { useState } from "react";

type DemoImage = {
  src: string;
  alt: string;
  caption: string;
};

const DEMO_IMAGES: DemoImage[] = [
  {
    src: "https://fblixafcxdnryhqfnnfa.supabase.co/storage/v1/object/public/files/demo_comment.png",
    alt: "コメント機能のスクリーンショット",
    caption: "コメント機能",
  },
  {
    src: "https://fblixafcxdnryhqfnnfa.supabase.co/storage/v1/object/public/files/demo_difference.png",
    alt: "差分検出のスクリーンショット",
    caption: "差分検出",
  },
];

export default function DemoImageSection() {
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState<string>("");

  const openModal = (src: string, alt: string) => {
    setModalSrc(src);
    setModalAlt(alt);
  };

  const closeModal = () => setModalSrc(null);

  return (
    <>
      <section className="w-full max-w-[900px] mb-16">
        <p className="text-xs text-gray-400 text-center mb-4">実際の画面</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEMO_IMAGES.map((img) => (
            <figure key={img.src} className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                onClick={() => openModal(img.src, img.alt)}
                className="w-full rounded-lg border border-gray-200 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
              />
              <figcaption className="text-xs text-gray-400 text-center">{img.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* モーダル */}
      {modalSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeModal}
        >
          {/* ×ボタン */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center transition"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 画像（クリックが内部に伝播しないよう stopPropagation） */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={modalSrc}
            alt={modalAlt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
    </>
  );
}
