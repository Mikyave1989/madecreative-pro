import { json } from '@remix-run/cloudflare';
import { useParams, useSearchParams } from '@remix-run/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

export const loader = () => json({});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  changedFiles?: string[];
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'text';
  mediaType: string;
  data: string;       // base64
  preview?: string;   // data URL for images
  size: number;
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#1f2937;padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1em;font-weight:600;margin:8px 0 4px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1em;font-weight:700;margin:10px 0 4px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.2em;font-weight:700;margin:12px 0 4px;">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style:disc;">$1</li>')
    .replace(/\n/g, '<br/>');
}

// ─── Strip boltAction blocks from AI text for display ─────────────────────────

function stripBoltActions(text: string): string {
  return text.replace(/<boltAction[\s\S]*?<\/boltAction>/g, '').trim();
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StudioRoute() {
  return (
    <ClientOnly fallback={<StudioSkeleton />}>
      {() => <StudioClient />}
    </ClientOnly>
  );
}

function StudioSkeleton() {
  return (
    <div style={{ background: '#0a0a0a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#9ca3af', fontSize: '14px' }}>Loading editor...</div>
    </div>
  );
}

// ─── Studio Client ────────────────────────────────────────────────────────────

function StudioClient() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const rebuildUrl = searchParams.get('rebuild');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── Load project on mount ──────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('mc_token');
    if (!token) return;

    fetch(`${API_URL}/portal/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((raw: unknown) => {
        const data = raw as { success: boolean; data?: { files?: Record<string, string>; deployUrl?: string; name?: string; subdomain?: string } };
        if (!data.success || !data.data) return;
        setFiles(data.data.files ?? {});
        setDeployUrl(data.data.deployUrl ?? null);
        setProjectName(data.data.name ?? '');
        setSubdomain(data.data.subdomain ?? null);
      })
      .then(() => {
        // Auto-trigger rebuild if ?rebuild=url was passed from the project launcher
        if (rebuildUrl) {
          setInput(`ricostruisci ${rebuildUrl}`);
        }
      })
      .catch((err) => console.error('[Studio] Failed to load project:', err));
  }, [id, rebuildUrl]);

  // ── Scroll to bottom of chat ───────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  // ── Reload files after AI update ──────────────────────────────────────────

  const reloadFiles = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('mc_token');
    if (!token) return;
    const res = await fetch(`${API_URL}/portal/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as { success: boolean; data?: { files?: Record<string, string> } };
    if (data.success && data.data?.files) {
      setFiles(data.data.files);
    }
  }, [id]);

  // ── Handle file attachments ────────────────────────────────────────────────

  const handleFiles = useCallback(async (fileList: FileList | null, type: 'image' | 'file') => {
    if (!fileList?.length) return;
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(fileList)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} è troppo grande (max 20MB)`);
        continue;
      }

      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          // Remove data URL prefix to get pure base64
          resolve(result.split(',')[1] ?? '');
        };
        reader.readAsDataURL(file);
      });

      const preview = type === 'image'
        ? await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          })
        : undefined;

      const attachType: Attachment['type'] = file.type.startsWith('image/') ? 'image'
        : file.type === 'application/pdf' ? 'pdf'
        : 'text';

      newAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: attachType,
        mediaType: file.type || 'application/octet-stream',
        data,
        preview,
        size: file.size,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    toast.success(`${newAttachments.length} file allegato/i`, { autoClose: 2000 });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // ── Scrape website before rebuild ─────────────────────────────────────────

  const scrapeAndInject = useCallback(async (rawMsg: string): Promise<string> => {
    const rebuildKw = /ricostruisci|ricostruire|rebuild|clone|clona|rifai|ricrea|analizza|copia il sito/i.test(rawMsg);
    const urlMatch = rawMsg.match(/https?:\/\/[^\s"'<>]+/i)?.[0]
      ?? rawMsg.match(/(?:^|\s)((?:www\.)?[a-z0-9][-a-z0-9.]+\.[a-z]{2,})(?:\s|$)/i)?.[1];

    if (!rebuildKw || !urlMatch) return rawMsg;

    const urlToScrape = urlMatch.startsWith('http') ? urlMatch : 'https://' + urlMatch;
    toast.info(`🔍 Scraping ${urlToScrape}…`, { autoClose: 90000, position: 'top-center', toastId: 'scraping' });

    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 120_000);
      const res = await fetch('https://agent-runner-production-b33a.up.railway.app/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScrape }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      toast.dismiss('scraping');

      if (!res.ok) throw new Error(`Scrape HTTP ${res.status}`);
      const data = await res.json() as { data?: { scraped?: { pages?: any[]; logo?: string; contact?: any; socialLinks?: any } } };
      const scraped = data.data?.scraped;

      if (!scraped?.pages?.length) {
        toast.warning('Scraping: nessuna pagina trovata — procedo senza contenuto reale', { autoClose: 3000 });
        return rawMsg;
      }

      const seen = new Set<string>();
      const pages = scraped.pages.filter((p: any) => {
        const n = (p.url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        if (!n || seen.has(n)) return false;
        seen.add(n);
        return p.headings?.length || p.paragraphs?.length || p.images?.length;
      });

      let pagesContent = '';
      let totalImgs = 0, totalVids = 0;
      const navPages = pages.map((p: any) => {
        const path = p.url.replace(/^https?:\/\/(www\.)?[^/]+/, '').replace(/\/$/, '') || '/';
        const h1 = p.headings?.find((h: any) => h.level === 1)?.text || p.title || '';
        return `${path} → "${h1}"`;
      }).join('\n');

      for (const p of pages) {
        const imgs = (p.images || []).filter((i: any) => i.url?.startsWith('http') && /\.(jpg|jpeg|png|webp)/i.test(i.url));
        totalImgs += imgs.length;
        const vids = (p.videos || []);
        totalVids += vids.length;
        const localPath = (p.url.replace(/^https?:\/\/(www\.)?[^/]+/, '').replace(/\/$/, '') || '/index').replace(/^\//, '') + '/index.html';
        pagesContent += `\n=== PAGE: ${localPath === '/index/index.html' ? 'index.html' : localPath} ===\n`
          + `Title: ${p.title || ''}\n`
          + `Headings:\n${(p.headings || []).map((h: any) => `  h${h.level}: ${h.text}`).join('\n') || '  none'}\n`
          + `Text:\n${(p.paragraphs || []).map((t: string) => `  ${t}`).join('\n') || '  none'}\n`
          + `Photos:\n${imgs.map((i: any, n: number) => `  ${n+1}. ${i.url}${i.alt ? ' ('+i.alt+')' : ''}`).join('\n') || '  none'}\n`
          + (vids.length ? `Videos:\n${vids.map((v: any) => `  VIDEO (${v.type}): ${v.url}`).join('\n')}\n` : '');
      }

      const injection = `\n\n=== SCRAPED: ${urlToScrape} ===\nLogo: ${scraped.logo||'none'}\nPhone: ${scraped.contact?.phone||'N/A'} | Email: ${scraped.contact?.email||'N/A'}\nFacebook: ${scraped.socialLinks?.facebook||''} | Instagram: ${scraped.socialLinks?.instagram||''}\n${totalVids > 0 ? '⚠️ VIDEO FOUND — use as full-screen autoplay muted hero!\n' : ''}\nSTRUCTURE (${pages.length} pages):\n${navPages}\n\nvercel.json: {"cleanUrls":true,"trailingSlash":false}\n${pagesContent}=== END SCRAPED ===`;

      toast.success(`Scraped ${pages.length} pagine, ${totalImgs} foto, ${totalVids} video ✓`, { autoClose: 3000, position: 'bottom-right' });
      return rawMsg + injection;
    } catch (err) {
      toast.dismiss('scraping');
      toast.warning('Scraping fallito — procedo senza contenuto reale', { autoClose: 3000 });
      return rawMsg;
    }
  }, []);

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const raw = input.trim();
    if (!raw || isStreaming || !id) return;

    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);

    const msg = await scrapeAndInject(raw);

    setMessages((prev) => [...prev, { role: 'user', content: raw, attachments: currentAttachments }]);
    setIsStreaming(true);

    const token = localStorage.getItem('mc_token');
    let aiText = '';

    try {
      const res = await fetch(`${API_URL}/portal/projects/${id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({
          message: msg,
          attachments: currentAttachments.map(a => ({
            type: a.type,
            mediaType: a.mediaType,
            data: a.data,
            name: a.name,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let changedFiles: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const ev = JSON.parse(data) as { type: string; content?: string; changedFiles?: string[]; error?: string };

            if (ev.type === 'text' && ev.content) {
              aiText += ev.content;
              const displayText = stripBoltActions(aiText);
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...last, content: displayText }];
                }
                return [...prev, { role: 'assistant', content: displayText, changedFiles: [] }];
              });
            } else if (ev.type === 'done') {
              changedFiles = ev.changedFiles ?? [];
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...last, changedFiles }];
                }
                return prev;
              });
            } else if (ev.type === 'error') {
              toast.error(ev.error ?? 'AI error');
            }
          } catch {
            // skip malformed SSE
          }
        }
      }

      if (changedFiles.length > 0) {
        await reloadFiles();
        setIframeKey((k) => k + 1);
        toast.success('Changes saved', { autoClose: 2000, position: 'bottom-right' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to send message: ${msg}`);
      console.error('[Studio] sendMessage error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, id, reloadFiles]);

  // ── Deploy ─────────────────────────────────────────────────────────────────

  const handleDeploy = async () => {
    if (!id || deploying) return;
    setDeploying(true);
    const token = localStorage.getItem('mc_token');
    try {
      const res = await fetch(`${API_URL}/portal/projects/${id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ files, forceStatic: !('package.json' in files) }),
      });
      const data = await res.json() as { success: boolean; data?: { deployUrl?: string } };
      if (data.success && data.data?.deployUrl) {
        setDeployUrl(data.data.deployUrl);
        toast.success('Site published!', { autoClose: 3000 });
        setIframeKey((k) => k + 1);
      } else {
        toast.error('Deploy failed');
      }
    } catch (err) {
      toast.error('Deploy error');
      console.error('[Studio] deploy error:', err);
    } finally {
      setDeploying(false);
    }
  };

  // ── Rename project ─────────────────────────────────────────────────────────

  const handleRename = async () => {
    if (!id || !projectName.trim()) return;
    const token = localStorage.getItem('mc_token');
    try {
      await fetch(`${API_URL}/portal/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ name: projectName }),
      });
      setEditingName(false);
    } catch {
      setEditingName(false);
    }
  };

  // ── Preview URL ────────────────────────────────────────────────────────────

  // Only use deployUrl for the preview — the subdomain URL only works after an
  // explicit Vercel deploy. Showing it before deploy causes DNS-not-found errors.
  const previewUrl = deployUrl ?? null;
  const hasFiles = Object.keys(files).length > 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0a',
        color: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          height: '48px',
          minHeight: '48px',
          background: '#111827',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {/* Left: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              MadeCreative
            </span>
          </a>
        </div>

        {/* Center: project name */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditingName(false);
              }}
              autoFocus
              style={{
                background: '#1f2937',
                border: '1px solid #6366f1',
                borderRadius: '6px',
                color: '#f9fafb',
                fontSize: '14px',
                fontWeight: 500,
                padding: '4px 10px',
                outline: 'none',
                textAlign: 'center',
                maxWidth: '300px',
                width: '100%',
              }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f9fafb',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
              title="Click to rename"
            >
              {projectName || 'Untitled Project'}
            </button>
          )}
        </div>

        {/* Right: deploy button */}
        <div style={{ minWidth: '160px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#9ca3af',
                fontSize: '12px',
                textDecoration: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #1f2937',
              }}
            >
              <span style={{ fontSize: '12px' }}>&#127760;</span>
              Live
            </a>
          )}
          <button
            onClick={handleDeploy}
            disabled={deploying || Object.keys(files).length === 0}
            style={{
              background: deploying ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: deploying ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s',
              opacity: Object.keys(files).length === 0 ? 0.5 : 1,
            }}
          >
            {deploying ? (
              <>
                <SpinnerIcon size={13} />
                Deploying...
              </>
            ) : (
              <>
                <span style={{ fontSize: '13px' }}>&#128640;</span>
                Deploy
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Body: Chat + Preview ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Chat Panel (40%) ── */}
        <div
          style={{
            width: '40%',
            minWidth: '320px',
            maxWidth: '560px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #1f2937',
            background: '#111827',
          }}
        >
          {/* Message list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  textAlign: 'center',
                  gap: '12px',
                  padding: '40px 16px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  &#10024;
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#f9fafb', marginBottom: '6px' }}>
                    AI Website Editor
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                    Ask me to add features, change colors, update content, or redesign any part of your site.
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {isStreaming && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Hidden file inputs */}
          <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files, 'image')} />
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv,.json,.md,.html,.css,.js,.ts" multiple style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files, 'file')} />

          {/* Input area */}
          <div style={{ padding: '12px', borderTop: '1px solid #1f2937', background: '#0f172a' }}>

            {/* Attachment preview strip */}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', padding: '8px', background: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
                {attachments.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#374151', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', color: '#d1d5db', maxWidth: '160px' }}>
                    {a.preview
                      ? <img src={a.preview} alt={a.name} style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                      : <span style={{ fontSize: '16px', flexShrink: 0 }}>{a.type === 'pdf' ? '📄' : '📎'}</span>
                    }
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                    <button onClick={() => removeAttachment(a.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0', fontSize: '14px', flexShrink: 0, lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Chiedi di modificare il sito, ricostruire, aggiungere sezioni... (Ctrl+Enter)"
                disabled={isStreaming}
                rows={1}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#f9fafb',
                  fontSize: '14px',
                  padding: '12px 14px 4px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  minHeight: '40px',
                  maxHeight: '160px',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px 8px',
                }}
              >
                {/* Left: action buttons */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {/* Image upload */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isStreaming}
                    title="Allega foto"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>
                  {/* File/PDF upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isStreaming}
                    title="Allega file (PDF, TXT, HTML...)"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  {/* Screenshot / inspect element hint */}
                  <button
                    onClick={() => setInput(prev => prev + (prev ? ' ' : '') + '[screenshot] ')}
                    disabled={isStreaming}
                    title="Chiedi modifica visiva"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 13.5V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.5"/><path d="M2 10.5V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5.5"/>
                      <line x1="12" y1="12" x2="12" y2="15"/><line x1="10" y1="15" x2="14" y2="15"/>
                    </svg>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {attachments.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#6366f1' }}>{attachments.length} allegato/i</span>
                  )}
                <button
                  onClick={sendMessage}
                  disabled={isStreaming || (!input.trim() && attachments.length === 0)}
                  style={{
                    background: isStreaming || (!input.trim() && attachments.length === 0)
                      ? '#374151'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: '7px',
                    color: '#fff',
                    cursor: isStreaming || (!input.trim() && attachments.length === 0) ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'background 0.2s',
                  }}
                >
                  {isStreaming ? <SpinnerIcon size={12} /> : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                    </svg>
                  )}
                  {isStreaming ? 'Thinking...' : 'Invia'}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview Panel (60%) ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0a0a',
            overflow: 'hidden',
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              height: '40px',
              minHeight: '40px',
              background: '#111827',
              borderBottom: '1px solid #1f2937',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: '4px',
            }}
          >
            {(['preview', 'code'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#1f2937' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: activeTab === tab ? '#f9fafb' : '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  padding: '5px 14px',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'preview' ? '&#128064; Preview' : '&#128196; Code'}
              </button>
            ))}

            <div style={{ flex: 1 }} />

            {activeTab === 'preview' && (
              <button
                onClick={() => {
                  setIframeLoading(true);
                  setIframeKey((k) => k + 1);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #1f2937',
                  borderRadius: '6px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Refresh preview"
              >
                &#8635; Refresh
              </button>
            )}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {activeTab === 'preview' && (
              <>
                {iframeLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(10,10,10,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                    }}
                  >
                    <SpinnerIcon size={28} />
                  </div>
                )}
                {previewUrl ? (
                  <iframe
                    key={iframeKey}
                    src={previewUrl}
                    title="Site preview"
                    onLoad={() => setIframeLoading(false)}
                    onError={() => setIframeLoading(false)}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: '#fff',
                    }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      gap: '16px',
                      textAlign: 'center',
                      padding: '32px',
                    }}
                  >
                    <div style={{ fontSize: '40px' }}>{hasFiles ? '🚀' : '✨'}</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#f9fafb', marginBottom: '8px' }}>
                        {hasFiles ? 'Sito generato — clicca Deploy per vederlo live' : 'Nessun sito ancora'}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.7, color: '#6b7280' }}>
                        {hasFiles
                          ? 'Il sito è stato generato. Clicca il pulsante Deploy in alto a destra per pubblicarlo su Vercel e vedere la preview.'
                          : 'Chiedi all\'AI di costruire il sito. Es: "ricostruisci www.miosito.it" oppure "crea un sito per un ristorante italiano a Milano".'}
                      </div>
                    </div>
                    <button
                      onClick={handleDeploy}
                      disabled={deploying || Object.keys(files).length === 0}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        padding: '10px 24px',
                        marginTop: '8px',
                        opacity: Object.keys(files).length === 0 ? 0.5 : 1,
                      }}
                    >
                      {deploying ? 'Deploying...' : '&#128640; Deploy Now'}
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'code' && (
              <CodePanel files={files} selectedFile={selectedFile} onSelectFile={setSelectedFile} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Message Component ───────────────────────────────────────────────────

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '4px',
      }}
    >
      <div
        style={{
          background: isUser ? '#1e1b4b' : '#1a2235',
          border: `1px solid ${isUser ? '#3730a3' : '#1f2937'}`,
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          color: '#f9fafb',
          fontSize: '13.5px',
          lineHeight: 1.6,
          maxWidth: '90%',
          padding: '10px 14px',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />
      {/* Attachment thumbnails */}
      {message.attachments && message.attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '90%', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          {message.attachments.map(a => (
            <div key={a.id} style={{ position: 'relative' }}>
              {a.preview
                ? <img src={a.preview} alt={a.name} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #374151' }} />
                : <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{a.type === 'pdf' ? '📄' : '📎'}</span>
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  </div>
              }
            </div>
          ))}
        </div>
      )}
      {message.changedFiles && message.changedFiles.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '90%' }}>
          {message.changedFiles.map((f) => (
            <span
              key={f}
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: '#6ee7b7',
                fontSize: '11px',
                padding: '2px 7px',
                fontFamily: 'monospace',
              }}
            >
              &#128196; {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <div
        style={{
          background: '#1a2235',
          border: '1px solid #1f2937',
          borderRadius: '12px 12px 12px 2px',
          padding: '12px 16px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#6366f1',
              display: 'inline-block',
              animation: `bounce 1.2s infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Code Panel ───────────────────────────────────────────────────────────────

function CodePanel({
  files,
  selectedFile,
  onSelectFile,
}: {
  files: Record<string, string>;
  selectedFile: string | null;
  onSelectFile: (f: string) => void;
}) {
  const fileList = Object.keys(files).sort();
  const activeFile = selectedFile ?? fileList[0] ?? null;

  if (fileList.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '13px',
        }}
      >
        No files yet. Ask the AI to build your site.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* File tree */}
      <div
        style={{
          width: '200px',
          minWidth: '160px',
          borderRight: '1px solid #1f2937',
          background: '#111827',
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {fileList.map((f) => (
          <button
            key={f}
            onClick={() => onSelectFile(f)}
            style={{
              background: activeFile === f ? '#1f2937' : 'transparent',
              border: 'none',
              borderLeft: activeFile === f ? '2px solid #6366f1' : '2px solid transparent',
              color: activeFile === f ? '#f9fafb' : '#9ca3af',
              cursor: 'pointer',
              display: 'block',
              fontSize: '12px',
              fontFamily: 'monospace',
              padding: '5px 12px',
              textAlign: 'left',
              width: '100%',
              wordBreak: 'break-all',
              lineHeight: 1.4,
              transition: 'background 0.1s',
            }}
          >
            {getFileIcon(f)} {f}
          </button>
        ))}
      </div>

      {/* File content */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>
        {activeFile && files[activeFile] !== undefined ? (
          <pre
            style={{
              color: '#e5e7eb',
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
              fontSize: '12px',
              lineHeight: 1.7,
              margin: 0,
              padding: '16px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              tabSize: 2,
            }}
          >
            <code>{files[activeFile]}</code>
          </pre>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '13px',
            }}
          >
            Select a file
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Spinner icon ─────────────────────────────────────────────────────────────

function SpinnerIcon({ size = 16 }: { size?: number }) {
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── File icon helper ─────────────────────────────────────────────────────────

function getFileIcon(filePath: string): string {
  if (filePath.endsWith('.html')) return '&#128196;';
  if (filePath.endsWith('.css')) return '&#127912;';
  if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) return '&#128196;';
  if (filePath.endsWith('.json')) return '&#123;&#125;';
  if (filePath.endsWith('.svg')) return '&#127912;';
  if (filePath.endsWith('.md')) return '&#128221;';
  return '&#128196;';
}
