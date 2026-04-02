"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSession(title: string): Promise<string | null> {
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabaseAuth
    .from("sessions")
    .insert({ title, user_id: user.id })
    .select("share_token")
    .single();

  if (error) {
    console.error("createSession error:", error);
    return null;
  }
  return data?.share_token ?? null;
}

export async function deleteSession(sessionId: string): Promise<{ error?: string }> {
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return { error: "ログインが必要です" };
  }
  const { error } = await supabaseAuth.from("sessions").delete().eq("id", sessionId);
  if (error) {
    console.error("deleteSession error:", error);
    return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/dashboard");
  return {};
}
