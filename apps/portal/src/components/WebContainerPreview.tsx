"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  files: Record<string, string>;
  onReady?: () => void;
}

type Status = "booting" | "mounting" | "installing" | "starting" | "ready" | "error";

const STATUS_LABELS: Record<Status, string> = {
  booting: "Starting environment...",
  mounting: "Loading project files...",
  installing: "Installing dependencies...",
  starting: "Starting dev server...",
  ready: "",
  error: "Preview failed",
};

export function WebContainerPreview({ files, onReady }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<any>(null);
  const [status, setStatus] = useState<Status>("booting");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const mountedFilesRef = useRef<string>("");

  // Convert flat file map to WebContainer file tree format
  const toFileTree = useCallback((projectFiles: Record<string, string>) => {
    const tree: Record<string, any> = {};
    for (const [path, content] of Object.entries(projectFiles)) {
      const parts = path.split("/");
      let current = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts[i]!;
        if (!current[dir]) current[dir] = { directory: {} };
        current = current[dir].directory;
      }
      current[parts[parts.length - 1]!] = { file: { contents: content } };
    }
    return tree;
  }, []);

  // Boot + first mount
  useEffect(() => {
    if (Object.keys(files).length === 0) return;

    let cancelled = false;

    async function init() {
      try {
        // Dynamic import to avoid SSR issues
        const { WebContainer } = await import("@webcontainer/api");

        if (cancelled) return;
        setStatus("booting");

        // Boot only once
        if (!containerRef.current) {
          containerRef.current = await WebContainer.boot();
        }
        const wc = containerRef.current;

        if (cancelled) return;
        setStatus("mounting");

        // Mount all project files
        const fileTree = toFileTree(files);
        await wc.mount(fileTree);
        mountedFilesRef.current = JSON.stringify(Object.keys(files).sort());

        if (cancelled) return;
        setStatus("installing");

        // npm install
        const install = await wc.spawn("npm", ["install"]);
        const installCode = await install.exit;
        if (installCode !== 0) {
          console.error("npm install failed with code", installCode);
          setStatus("error");
          return;
        }

        if (cancelled) return;
        setStatus("starting");

        // Start dev server
        await wc.spawn("npm", ["run", "dev"]);

        // Wait for server to be ready
        wc.on("server-ready", (_port: number, url: string) => {
          if (cancelled) return;
          setPreviewUrl(url);
          setStatus("ready");
          onReady?.();
        });
      } catch (err) {
        console.error("WebContainer error:", err);
        if (!cancelled) setStatus("error");
      }
    }

    init();
    return () => { cancelled = true; };
  }, []); // Only run once on mount

  // Update files without full reinstall (hot update)
  useEffect(() => {
    if (!containerRef.current || status !== "ready") return;
    const currentKeys = JSON.stringify(Object.keys(files).sort());
    if (currentKeys === mountedFilesRef.current) return;

    async function updateFiles() {
      try {
        const wc = containerRef.current;
        const fileTree = toFileTree(files);
        await wc.mount(fileTree);
        mountedFilesRef.current = JSON.stringify(Object.keys(files).sort());
      } catch (err) {
        console.error("File update error:", err);
      }
    }
    updateFiles();
  }, [files, status, toFileTree]);

  if (status !== "ready") {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "#09090b", color: "#52525b",
      }}>
        {status === "error" ? (
          <>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#ef4444", fontSize: 20 }}>!</span>
            </div>
            <p style={{ fontSize: 13 }}>Preview failed to load</p>
          </>
        ) : (
          <>
            <div style={{
              width: 32, height: 32, border: "2px solid #27272a", borderTopColor: "#6366f1",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ fontSize: 13 }}>{STATUS_LABELS[status]}</p>
            {status === "installing" && (
              <p style={{ fontSize: 11, color: "#3f3f46" }}>This may take 15-30 seconds on first load</p>
            )}
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={previewUrl}
      style={{ width: "100%", height: "100%", border: "none" }}
      allow="cross-origin-isolated"
    />
  );
}
