import { NextRequest, NextResponse } from "next/server";
import { detectTextDiff } from "@/lib/diffUtils";

export async function POST(request: NextRequest) {
  try {
    const { leftText, rightText } = await request.json();

    if (typeof leftText !== "string" || typeof rightText !== "string") {
      return NextResponse.json(
        { error: "leftText と rightText は必須です" },
        { status: 400 }
      );
    }

    const result = detectTextDiff(leftText, rightText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Diff error:", error);
    return NextResponse.json(
      { error: "差分検出に失敗しました" },
      { status: 500 }
    );
  }
}
