"use server";

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
