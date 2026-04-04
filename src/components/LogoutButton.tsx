"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action="/auth/signout"
      method="post"
      onSubmit={() => setLoading(true)}
    >
      <button
        type="submit"
        disabled={loading}
        className="text-sm text-gray-600 hover:text-gray-900 hover:underline disabled:opacity-50"
      >
        {loading ? "ログアウト中..." : "ログアウト"}
      </button>
    </form>
  );
}
