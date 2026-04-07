"use client";

import { useState } from "react";
import Link from "next/link";

type HeroSectionProps = {
  submitAction: (formData: FormData) => Promise<void>;
  sessionError: boolean;
};

const DEMO_IMAGES = [
  {
    src: "/images/demo_comment.png",
    alt: "コメント機能のスクリーンショット",
    caption: "コメント機能",
  },
  {
    src: "/images/demo_difference.png",
    alt: "差分検出のスクリーンショット",
    caption: "差分検出",
  },
];

export default function HeroSection({ submitAction, sessionError }: HeroSectionProps) {
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [modalAlt, setModalAlt] = useState("");

  return (
    <>
      {/* 2カラムヒーロー */}
      <section className="w-full max-w-[1200px] mx-auto mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start px-6 py-16">

        {/* 左カラム：キャッチコピー + フォーム */}
        <div className="flex flex-col gap-6 self-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight leading-snug">
              資料を並べて、<br />確認を前に進める
            </h1>
            <p className="text-gray-500 text-base leading-relaxed">
              2つの資料を左右に並べて比較・コメント。<br />
              共有URLで関係者と確認できます。
            </p>
          </div>

          {/* フォームカード */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {sessionError && (
              <p
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-4"
                role="alert"
              >
                セッションを作成できませんでした。しばらくしてから再度お試しください。
              </p>
            )}
            <form action={submitAction} className="space-y-3">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  セッションタイトル
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="例: イベントA 資料比較"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 active:bg-gray-950 transition"
              >
                比較セッションを作成
              </button>
            </form>
            <p className="mt-3 text-xs text-gray-400 text-center">
              作成には{" "}
              <Link href="/login" className="underline hover:text-gray-600">
                ログイン
              </Link>
              {" "}が必要です
            </p>
          </div>

          {/* 特徴カード3つ（縦並び） */}
          <div className="flex flex-col gap-3">

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M3 9h18M3 15h18" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">左右で比較</h3>
                <p className="text-xs text-gray-500 leading-relaxed">2つの資料を並べて、差分をスクロールしながら確認できます</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">コメント</h3>
                <p className="text-xs text-gray-500 leading-relaxed">気になる箇所を指定して、確認コメントを残せます</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">URL共有</h3>
                <p className="text-xs text-gray-500 leading-relaxed">専用URLを発行。ログイン不要でクライアントと共有できます</p>
              </div>
            </div>

          </div>

          {/* フッターノート */}
          <p className="text-xs text-gray-400 text-center">
            セッション一覧は公開されません。共有URLを知っている方だけがアクセスできます。
          </p>

        </div>

        {/* 右カラム：デモ画像2枚縦並び */}
        <div className="flex flex-col gap-4 self-start">
          {DEMO_IMAGES.map((img) => (
            <figure key={img.src} className="flex flex-col gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                onClick={() => { setModalSrc(img.src); setModalAlt(img.alt); }}
                className="w-full rounded-lg border border-gray-200 object-cover cursor-zoom-in hover:opacity-90 transition-opacity shadow-sm"
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
          onClick={() => setModalSrc(null)}
        >
          <button
            type="button"
            onClick={() => setModalSrc(null)}
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center transition"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
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
