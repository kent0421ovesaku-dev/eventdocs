import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (
    !url ||
    !key ||
    url === "YOUR_SUPABASE_URL" ||
    !url.startsWith("http")
  ) {
    return null;
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export const supabase = getSupabase();

export type Session = {
  id: string;
  title: string;
  share_token: string;
  created_at: string;
};

export type FileRecord = {
  id: string;
  session_id: string;
  side: "left" | "right";
  original_name: string;
  file_type: string;
  storage_path: string;
  version?: number;
  is_current?: boolean;
  created_at: string;
};

export type Comment = {
  id: string;
  session_id: string;
  side: "left" | "right";
  x_percent: number;
  y_percent: number;
  commenter_name: string;
  content: string;
  page_number?: number | null;
  is_resolved?: boolean;
  created_at: string;
};
