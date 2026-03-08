"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import DiffViewer from "@/components/DiffViewer";
import NameModal from "@/components/NameModal";

const STORAGE_KEY = "commenter_name";

type SessionData = {
  id: string;
  title: string;
  share_token: string;
};

export default function SessionPage() {
  const params = useParams();
  const share_token = params?.share_token as string | undefined;
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not_found">("loading");
  const [showNameModal, setShowNameModal] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);

  useEffect(() => {
    if (!share_token) return;
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("not_found");
      return;
    }
    supabase
      .from("sessions")
      .select("id, title, share_token")
      .eq("share_token", share_token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setStatus("not_found");
        else {
          setSession(data as SessionData);
          setStatus("ready");
        }
      });
  }, [share_token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const name = localStorage.getItem(STORAGE_KEY);
    setSavedName(name ?? null);
  }, []);

  useEffect(() => {
    if (status !== "ready" || typeof window === "undefined") return;
    const name = localStorage.getItem(STORAGE_KEY);
    if (!name?.trim()) setShowNameModal(true);
  }, [status]);

  const handleNameSubmit = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setSavedName(name);
    setShowNameModal(false);
  }, []);

  if (status === "not_found") notFound();
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-panel-bg">
        <p className="text-gray-500">読み込み中…</p>
      </div>
    );
  }

  return (
    <>
      {showNameModal && (
        <NameModal onSubmit={handleNameSubmit} />
      )}
      <DiffViewer
        sessionId={session.id}
        shareToken={session.share_token}
        title={session.title}
        displayName={savedName}
        onRequestNameChange={() => setShowNameModal(true)}
      />
    </>
  );
}
