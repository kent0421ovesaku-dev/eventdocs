"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "./supabase";

export async function createSession(title: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("sessions")
    .insert({ title })
    .select("share_token")
    .single();

  if (error) {
    console.error("createSession error:", error);
    return null;
  }
  return data?.share_token ?? null;
}

export async function deleteSession(sessionId: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabaseが未設定です" };
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) {
    console.error("deleteSession error:", error);
    return { error: error.message };
  }
  revalidatePath("/");
  return {};
}
