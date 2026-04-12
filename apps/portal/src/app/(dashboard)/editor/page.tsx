"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL ?? "https://madecreative-editor-production.up.railway.app";

export default function EditorRedirect() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  useEffect(() => {
    // Redirect to the MadeCreative Editor (bolt.diy)
    const url = projectId ? `${EDITOR_URL}?project=${projectId}` : EDITOR_URL;
    window.location.href = url;
  }, [projectId]);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#09090b", color: "#a1a1aa",
      fontFamily: "system-ui", flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: "2px solid #27272a", borderTopColor: "#6366f1",
        borderRadius: "50%", animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: 14 }}>Opening MadeCreative Editor...</p>
      <a href={EDITOR_URL} style={{ fontSize: 12, color: "#6366f1", textDecoration: "underline" }}>
        Click here if not redirected
      </a>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
