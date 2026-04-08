"use client";
import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem("cookie_consent", "minimal");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      style={{
        background: "rgba(13,17,23,0.97)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm flex-1" style={{ color: "rgba(248,250,252,0.6)" }}>
          Usiamo cookie tecnici essenziali e analitici anonimi (Plausible). Nessun cookie di
          profilazione.{" "}
          <a
            href="/it/privacy"
            style={{ color: "#818cf8" }}
            className="underline underline-offset-2"
          >
            Privacy Policy
          </a>
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: "rgba(248,250,252,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Solo essenziali
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "#6366f1", color: "white" }}
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
