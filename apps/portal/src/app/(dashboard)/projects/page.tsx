"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, Edit2, ExternalLink, FolderPlus, Globe, Layers,
  Loader2, MoreVertical, Plus, Sparkles, Trash2, X, Copy,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  domain: string;
  subdomain: string | null;
  deployUrl: string | null;
  deployStatus: string;
  sector: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.madecreative.pro";

async function apiFetch(path: string, token: string, opts?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function sectorColor(sector: string): string {
  const map: Record<string, string> = {
    restaurant: "#f97316",
    ecommerce: "#6366f1",
    beauty: "#ec4899",
    healthcare: "#10b981",
    professional: "#3b82f6",
    fitness: "#f59e0b",
    education: "#8b5cf6",
    hotel: "#14b8a6",
    automotive: "#64748b",
  };
  return map[sector.toLowerCase()] ?? "#6366f1";
}

// ─── New Project Modal ────────────────────────────────────────────────────────

function NewProjectModal({
  onClose,
  onCreated,
  token,
}: {
  onClose: () => void;
  onCreated: (project: Project) => void;
  token: string;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/portal/projects", token, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onCreated(data.data as Project);
      } else {
        setError(data.error ?? "Failed to create project");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name, token, onCreated]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#18181b", border: "1px solid #27272a", borderRadius: 16,
        padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderPlus style={{ width: 18, height: 18, color: "#818cf8" }} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>New Project</h2>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", background: "transparent", color: "#52525b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#a1a1aa", marginBottom: 8 }}>
            Project Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKey}
            placeholder="My Restaurant Site"
            style={{
              width: "100%", padding: "10px 14px", background: "#09090b", border: "1px solid #27272a",
              borderRadius: 10, fontSize: 14, color: "#f4f4f5", outline: "none",
              boxSizing: "border-box", fontFamily: "inherit",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#27272a"; }}
          />
          {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{error}</p>}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #27272a", background: "transparent", color: "#a1a1aa", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            style={{
              padding: "9px 20px", borderRadius: 8, border: "none", cursor: name.trim() && !loading ? "pointer" : "default",
              background: name.trim() && !loading ? "#6366f1" : "#27272a",
              color: name.trim() && !loading ? "#fff" : "#52525b",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {loading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: 14, height: 14 }} />}
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename Modal ─────────────────────────────────────────────────────────────

function RenameModal({
  project,
  onClose,
  onRenamed,
  token,
}: {
  project: Project;
  onClose: () => void;
  onRenamed: (id: string, name: string) => void;
  token: string;
}) {
  const [name, setName] = useState(project.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleRename = useCallback(async () => {
    if (!name.trim() || name.trim() === project.name) { onClose(); return; }
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/portal/projects/${project.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onRenamed(project.id, name.trim());
        onClose();
      } else {
        setError(data.error ?? "Failed to rename");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [name, project.id, project.name, token, onRenamed, onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5", marginTop: 0, marginBottom: 16 }}>Rename Project</h2>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") onClose(); }}
          style={{ width: "100%", padding: "10px 14px", background: "#09090b", border: "1px solid #27272a", borderRadius: 10, fontSize: 14, color: "#f4f4f5", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 16 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#27272a"; }}
        />
        {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #27272a", background: "transparent", color: "#a1a1aa", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleRename} disabled={!name.trim() || loading} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            {loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Check style={{ width: 13, height: 13 }} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  token,
  onOpen,
  onRename,
  onDelete,
  onDuplicate,
}: {
  project: Project;
  token: string;
  onOpen: (id: string) => void;
  onRename: (project: Project) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleDuplicate = async () => {
    setMenuOpen(false);
    setDuplicating(true);
    onDuplicate(project.id);
    setDuplicating(false);
  };

  const accent = sectorColor(project.sector);

  return (
    <div
      style={{
        background: "#18181b", border: "1px solid #27272a", borderRadius: 14,
        transition: "border-color 0.15s, transform 0.15s",
        cursor: "pointer", position: "relative",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272a"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Preview area */}
      <div
        onClick={() => onOpen(project.id)}
        style={{
          height: 140, background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", borderBottom: "1px solid #27272a",
          overflow: "hidden", borderRadius: "14px 14px 0 0",
        }}
      >
        <Globe style={{ width: 40, height: 40, color: accent, opacity: 0.3 }} />

        {/* Status badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
          background: project.deployStatus === "DEPLOYED" ? "rgba(34,197,94,0.12)" : "rgba(99,102,241,0.12)",
          color: project.deployStatus === "DEPLOYED" ? "#22c55e" : "#818cf8",
          border: `1px solid ${project.deployStatus === "DEPLOYED" ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.2)"}`,
        }}>
          {project.deployStatus === "DEPLOYED" ? "Live" : "Draft"}
        </div>

        {/* Sector badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
          background: `${accent}18`, color: accent,
        }}>
          {project.sector}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              onClick={() => onOpen(project.id)}
              style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}
            >
              {project.name}
            </h3>
            <p style={{ fontSize: 11, color: "#52525b", margin: 0 }}>
              Edited {relativeTime(project.updatedAt)}
            </p>
          </div>

          {/* Menu button */}
          <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{ width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", background: menuOpen ? "#27272a" : "transparent", color: "#52525b", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#27272a"; e.currentTarget.style.color = "#a1a1aa"; }}
              onMouseLeave={(e) => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#52525b"; } }}
            >
              <MoreVertical style={{ width: 14, height: 14 }} />
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: 32, zIndex: 50,
                background: "#18181b", border: "1px solid #27272a", borderRadius: 10,
                padding: 4, minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}>
                <MenuItem icon={<Sparkles style={{ width: 13, height: 13 }} />} label="Open in Editor"
                  onClick={() => { setMenuOpen(false); onOpen(project.id); }} />
                {project.deployUrl && (
                  <MenuItem icon={<ExternalLink style={{ width: 13, height: 13 }} />} label="View Live Site"
                    onClick={() => { setMenuOpen(false); window.open(project.deployUrl!, "_blank"); }} />
                )}
                <MenuItem icon={<Edit2 style={{ width: 13, height: 13 }} />} label="Rename"
                  onClick={() => { setMenuOpen(false); onRename(project); }} />
                <MenuItem icon={duplicating ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Copy style={{ width: 13, height: 13 }} />} label="Duplicate"
                  onClick={handleDuplicate} />
                <div style={{ height: 1, background: "#27272a", margin: "4px 0" }} />
                <MenuItem icon={<Trash2 style={{ width: 13, height: 13 }} />} label="Delete"
                  danger
                  onClick={() => { setMenuOpen(false); onDelete(project.id); }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 7, border: "none", cursor: "pointer",
        background: "transparent", color: danger ? "#f87171" : "#a1a1aa", fontSize: 13, fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: 8, transition: "all 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "rgba(248,113,113,0.08)" : "#27272a"; e.currentTarget.style.color = danger ? "#f87171" : "#e4e4e7"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = danger ? "#f87171" : "#a1a1aa"; }}
    >
      {icon}{label}
    </button>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  projectName,
  onConfirm,
  onCancel,
  loading,
}: {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Trash2 style={{ width: 18, height: 18, color: "#ef4444" }} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f4f4f5", marginTop: 0, marginBottom: 8 }}>Delete Project?</h2>
        <p style={{ fontSize: 13, color: "#71717a", marginTop: 0, marginBottom: 24, lineHeight: 1.6 }}>
          <strong style={{ color: "#e4e4e7" }}>{projectName}</strong> will be permanently deleted. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #27272a", background: "transparent", color: "#a1a1aa", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            {loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Trash2 style={{ width: 13, height: 13 }} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load projects on mount
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiFetch("/portal/projects", token)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProjects(d.data as Project[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleOpen = useCallback((id: string) => {
    router.push(`/editor?project=${id}`);
  }, [router]);

  const handleCreated = useCallback((project: Project) => {
    setProjects((prev) => [project, ...prev]);
    setShowNew(false);
    // Navigate directly to the new project
    router.push(`/editor?project=${project.id}`);
  }, [router]);

  const handleRenamed = useCallback((id: string, name: string) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name } : p));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await apiFetch(`/portal/projects/${deleteTarget}`, token, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch { /* silent */ }
    setDeleting(false);
    setDeleteTarget(null);
  }, [deleteTarget, token]);

  const handleDuplicate = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const res = await apiFetch(`/portal/projects/${id}/duplicate`, token, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Reload full list to get the duplicate with all fields
        const listRes = await apiFetch("/portal/projects", token);
        const listData = await listRes.json();
        if (listData.success) setProjects(listData.data as Project[]);
      }
    } catch { /* silent */ }
  }, [token]);

  const deleteProject = projects.find((p) => p.id === deleteTarget);

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "32px 24px 0", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers style={{ width: 16, height: 16, color: "#fff" }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f4f4f5", margin: 0 }}>Projects</h1>
            </div>
            <p style={{ fontSize: 13, color: "#52525b", margin: 0 }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""} — click any to open in the editor
            </p>
          </div>

          <button
            onClick={() => setShowNew(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              boxShadow: "0 4px 24px rgba(99,102,241,0.3)", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            New Project
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
            <Loader2 style={{ width: 28, height: 28, color: "#3f3f46", animation: "spin 1s linear infinite" }} />
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Sparkles style={{ width: 36, height: 36, color: "#6366f1", opacity: 0.6 }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#e4e4e7", marginBottom: 10 }}>Create your first project</h2>
            <p style={{ fontSize: 14, color: "#52525b", marginBottom: 32, maxWidth: 380, lineHeight: 1.7 }}>
              Each project is a full website you can build with AI. Start a new one to get going.
            </p>
            <button
              onClick={() => setShowNew(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit", boxShadow: "0 8px 32px rgba(99,102,241,0.3)" }}
            >
              <Plus style={{ width: 18, height: 18 }} />
              Create First Project
            </button>
          </div>
        ) : (
          /* Projects grid */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, paddingBottom: 80 }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                token={token ?? ""}
                onOpen={handleOpen}
                onRename={setRenameTarget}
                onDelete={setDeleteTarget}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNew && token && (
        <NewProjectModal
          token={token}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
      {renameTarget && token && (
        <RenameModal
          project={renameTarget}
          token={token}
          onClose={() => setRenameTarget(null)}
          onRenamed={handleRenamed}
        />
      )}
      {deleteTarget && deleteProject && (
        <DeleteConfirmModal
          projectName={deleteProject.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { scrollbar-width: thin; scrollbar-color: #27272a transparent; }
        *::-webkit-scrollbar { width: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
      `}</style>
    </div>
  );
}
