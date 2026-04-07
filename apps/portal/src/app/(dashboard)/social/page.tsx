"use client";

import { useState } from "react";
import {
  Instagram,
  Facebook,
  Share2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Upload,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  Check,
  X,
  Pencil,
  RefreshCw,
  TrendingUp,
  Heart,
  Users,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialPost {
  id: string;
  platform: string;
  type: string;
  caption: string;
  hashtags: string | null;
  mediaUrls: string[];
  language: string;
  status: string;
  scheduledFor: string;
  approvedAt: string | null;
  publishedAt: string | null;
  igMediaId: string | null;
  fbPostId: string | null;
  likes: number;
  comments: number;
  reach: number;
  isCustom: boolean;
  createdAt: string;
}

interface SocialStats {
  connected: {
    instagram: boolean;
    facebook: boolean;
    socialPostingEnabled: boolean;
    socialAutoPublish: boolean;
  };
  stats: {
    postsThisMonth: number;
    publishedThisMonth: number;
    totalReach: number;
    totalEngagement: number;
    engagementRate: number;
    followerGrowth: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "https://api.madecreative.pro";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: { label: "Bozza", color: "bg-gray-100 text-gray-600", icon: Pencil },
  scheduled: {
    label: "Programmato",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  approved: {
    label: "Approvato",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  publishing: {
    label: "Pubblicazione...",
    color: "bg-yellow-100 text-yellow-700",
    icon: Loader2,
  },
  published: {
    label: "Pubblicato",
    color: "bg-indigo-100 text-indigo-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rifiutato",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onApprove,
  onReject,
  updating,
}: {
  post: SocialPost;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  updating: string | null;
}) {
  const status = STATUS_CONFIG[post.status] ?? STATUS_CONFIG["draft"];
  const StatusIcon = status.icon;
  const isUpdating = updating === post.id;
  const scheduledDate = new Date(post.scheduledFor);

  const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {post.platform === "INSTAGRAM" ? (
            <Instagram className="w-4 h-4 text-pink-500" />
          ) : (
            <Facebook className="w-4 h-4 text-blue-600" />
          )}
          <span className="text-xs font-medium text-gray-600">
            {post.platform}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-500 capitalize">{post.type}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Media preview */}
      {mediaUrls.length > 0 && (
        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={mediaUrls[0]}
            alt="Post media"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Caption */}
      <p className="text-sm text-gray-700 line-clamp-3">{post.caption}</p>

      {/* Hashtags */}
      {post.hashtags && (
        <p className="text-xs text-indigo-500 line-clamp-1">{post.hashtags}</p>
      )}

      {/* Scheduled date */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {scheduledDate.toLocaleDateString("it-IT", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}{" "}
          alle{" "}
          {scheduledDate.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Published stats */}
      {post.status === "published" && (
        <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" /> {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {post.reach}
          </span>
        </div>
      )}

      {/* Draft actions */}
      {post.status === "draft" && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => onApprove(post.id)}
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            )}
            Approva
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onReject(post.id)}
            disabled={isUpdating}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Connect card ──────────────────────────────────────────────────────────────

function ConnectCard({
  platform,
  connected,
  onConnect,
  connecting,
}: {
  platform: "instagram" | "facebook";
  connected: boolean;
  onConnect: (p: "instagram" | "facebook") => void;
  connecting: string | null;
}) {
  const Icon = platform === "instagram" ? Instagram : Facebook;
  const name = platform === "instagram" ? "Instagram" : "Facebook";
  const color =
    platform === "instagram"
      ? "from-purple-500 to-pink-500"
      : "from-blue-600 to-blue-700";
  const isConnecting = connecting === platform;

  return (
    <div
      className={`p-4 rounded-xl border ${connected ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-400">
              {connected ? "Account collegato" : "Non collegato"}
            </p>
          </div>
        </div>
        {connected ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <Button
            size="sm"
            onClick={() => onConnect(platform)}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : null}
            Connetti
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [statsData, setStatsData] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<
    "posts" | "connect" | "upload"
  >("posts");

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const [postsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/portal/social/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/portal/social/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const postsJson = (await postsRes.json()) as {
        success: boolean;
        data?: SocialPost[];
        error?: string;
      };
      const statsJson = (await statsRes.json()) as {
        success: boolean;
        data?: SocialStats;
        error?: string;
      };

      if (!postsJson.success) throw new Error(postsJson.error ?? "Errore");
      setPosts(postsJson.data ?? []);

      if (statsJson.success && statsJson.data) {
        setStatsData(statsJson.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    void loadPosts();
  });

  const handleUpdatePost = async (id: string, status: string) => {
    if (updating) return;
    setUpdating(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/social/posts/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: SocialPost;
        error?: string;
      };
      if (!json.success) throw new Error(json.error);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status, approvedAt: status === "approved" ? new Date().toISOString() : p.approvedAt } : p
        )
      );

      toast.success(
        status === "approved"
          ? "Post approvato"
          : status === "rejected"
            ? "Post rifiutato"
            : "Post aggiornato"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore nell'aggiornamento");
    } finally {
      setUpdating(null);
    }
  };

  const handleConnect = async (platform: "instagram" | "facebook") => {
    if (connecting) return;
    setConnecting(platform);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/social/connect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { authUrl: string };
        error?: string;
      };

      if (!json.success) {
        toast.error(json.error ?? "Connessione non disponibile");
        return;
      }

      if (json.data?.authUrl) {
        window.location.href = json.data.authUrl;
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Errore nella connessione"
      );
    } finally {
      setConnecting(null);
    }
  };

  const handleToggleAutoPublish = async () => {
    if (!statsData) return;
    const current = statsData.connected.socialAutoPublish;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/portal/social/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ socialAutoPublish: !current }),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { socialAutoPublish: boolean };
        error?: string;
      };

      if (!json.success) {
        toast.error(json.error ?? "Errore");
        return;
      }

      setStatsData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          connected: {
            ...prev.connected,
            socialAutoPublish: json.data?.socialAutoPublish ?? !current,
          },
        };
      });

      toast.success(
        !current
          ? "Auto-pubblicazione attivata"
          : "Auto-pubblicazione disattivata"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Errore nell'aggiornamento"
      );
    }
  };

  const draftPosts = posts.filter((p) => p.status === "draft");
  const upcomingPosts = posts.filter((p) =>
    ["scheduled", "approved"].includes(p.status)
  );
  const publishedPosts = posts
    .filter((p) => p.status === "published")
    .slice(0, 10);

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => void loadPosts()}>Riprova</Button>
      </div>
    );
  }

  const connected = statsData?.connected;
  const stats = statsData?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestisci i tuoi post programmati
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void loadPosts()}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
          />
          Aggiorna
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Post questo mese</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.postsThisMonth}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Reach totale</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalReach.toLocaleString("it-IT")}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Engagement rate</p>
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {stats.engagementRate}%
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Pubblicati</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.publishedThisMonth}
            </p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(
          [
            { key: "posts", label: "Post" },
            { key: "connect", label: "Account" },
            { key: "upload", label: "Foto" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.key === "posts" && draftPosts.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {draftPosts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {/* Draft posts needing approval */}
          {draftPosts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full" />
                Da approvare ({draftPosts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {draftPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onApprove={(id) => void handleUpdatePost(id, "approved")}
                    onReject={(id) => void handleUpdatePost(id, "rejected")}
                    updating={updating}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming posts */}
          {upcomingPosts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Programmati ({upcomingPosts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcomingPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onApprove={(id) => void handleUpdatePost(id, "approved")}
                    onReject={(id) => void handleUpdatePost(id, "rejected")}
                    updating={updating}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Published posts */}
          {publishedPosts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Pubblicati di recente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {publishedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onApprove={(id) => void handleUpdatePost(id, "approved")}
                    onReject={(id) => void handleUpdatePost(id, "rejected")}
                    updating={updating}
                  />
                ))}
              </div>
            </div>
          )}

          {posts.length === 0 && (
            <Card className="p-10 text-center">
              <Share2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Nessun post programmato. I post verranno generati
                automaticamente dall&apos;agente social.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "connect" && (
        <div className="space-y-4 max-w-md">
          <p className="text-sm text-gray-600">
            Collega i tuoi account social per pubblicare automaticamente.
          </p>

          <ConnectCard
            platform="instagram"
            connected={connected?.instagram ?? false}
            onConnect={handleConnect}
            connecting={connecting}
          />

          <ConnectCard
            platform="facebook"
            connected={connected?.facebook ?? false}
            onConnect={handleConnect}
            connecting={connecting}
          />

          {/* Auto-publish toggle */}
          {(connected?.instagram || connected?.facebook) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Auto-pubblicazione
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pubblica automaticamente i post approvati alla data
                    programmata
                  </p>
                </div>
                <button
                  onClick={() => void handleToggleAutoPublish()}
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {connected?.socialAutoPublish ? (
                    <ToggleRight className="w-8 h-8 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "upload" && (
        <div className="space-y-4 max-w-lg">
          <p className="text-sm text-gray-600">
            Carica le tue foto per i prossimi post. L&apos;agente social userà
            queste immagini nelle prossime pubblicazioni.
          </p>

          <FileUpload
            accept="image/*"
            maxFiles={10}
            onFilesChange={(files) => {
              setUploadedFiles(files);
            }}
          />

          {uploadedFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {uploadedFiles.length} file selezionati
              </p>
              <div className="grid grid-cols-3 gap-2">
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <Button
                className="mt-3"
                onClick={() => {
                  toast.success(
                    `${uploadedFiles.length} foto caricate con successo`
                  );
                  setUploadedFiles([]);
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Carica foto
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
