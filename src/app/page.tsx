import { redirect } from "next/navigation";
import { createSession } from "@/lib/actions";

export default function HomePage() {
  async function submitAction(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string)?.trim() || "無題の比較";
    const shareToken = await createSession(title);
    if (shareToken) redirect(`/session/${shareToken}`);
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          資料比較・コメントサービス
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          比較セッションを作成して、左右で資料を比較・コメントできます。
        </p>
        <form action={submitAction} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              セッションタイトル
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="例: イベントA 資料比較"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-accent text-white font-medium rounded-lg hover:bg-blue-600 transition"
          >
            比較セッションを作成
          </button>
        </form>
      </div>
    </main>
  );
}
