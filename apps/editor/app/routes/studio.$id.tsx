import { json } from '@remix-run/cloudflare';
import { useParams } from '@remix-run/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { toast } from 'react-toastify';
import { API_URL } from '~/lib/api/client';

// ─── Constants ───────────────────────────────────────────────────────────────

const API = API_URL;
const SCRAPE_URL = 'https://agent-runner-production-b33a.up.railway.app/scrape';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  files?: string[];
}

interface FileAttachment {
  name: string;
  type: string;
  data: string;
  preview?: string;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = () => json({});

// ─── Route ───────────────────────────────────────────────────────────────────

export default function StudioRoute() {
  return (
    <ClientOnly fallback={<Skeleton />}>
      {() => <Studio />}
    </ClientOnly>
  );
}

function Skeleton() {
  return (
    <div style={{ background: '#0a0a0a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Loading editor...</div>
    </div>
  );
}

// ─── Simple markdown ─────────────────────────────────────────────────────────

function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre style="background:#0d1117;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;margin:8px 0;border:1px solid #1f2937"><code>${code}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:#1f2937;padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1em;font-weight:600;margin:8px 0 4px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1em;font-weight:700;margin:10px 0 4px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.2em;font-weight:700;margin:12px 0 4px">$1</h1>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:16px;list-style:disc">$1</li>')
    .replace(/\n/g, '<br/>');
}

// ─── Studio Component ────────────────────────────────────────────────────────

function Studio() {
  const { id } = useParams<{ id: string }>();

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    }
  }, []);

  // Load project on mount
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('mc_token');
    if (!token) { window.location.href = '/login'; return; }

    fetch(`${API}/portal/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) { window.location.href = '/?exit=1'; return null; }
        return r.json();
      })
      .then(d => {
        if (!d?.success) return;
        setProjectName(d.data.name || '');
        setFiles(d.data.files || {});
        setDeployUrl(d.data.deployUrl || null);
        // Auto-rebuild if ?rebuild= param
        const url = new URLSearchParams(window.location.search).get('rebuild');
        if (url) setTimeout(() => doSend(`ricostruisci ${url}`), 800);
      })
      .catch(() => {
        toast.error('Failed to load project');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Scraping ─────────────────────────────────────────────────────────────

  async function scrapeAndEnrich(msg: string): Promise<string> {
    const rebuildRe = /ricostruisci|ricostruire|rebuild|clone|rifai|copia il sito/i;
    const urlRe = /https?:\/\/[^\s]+|(?:^|\s)((?:www\.)?[a-z0-9][-a-z0-9.]+\.[a-z]{2,})(?:\s|$)/i;
    if (!rebuildRe.test(msg)) return msg;
    const urlMatch = msg.match(/https?:\/\/[^\s]+/i)?.[0] || msg.match(urlRe)?.[1];
    if (!urlMatch) return msg;
    const url = urlMatch.startsWith('http') ? urlMatch : 'https://' + urlMatch;

    toast.info('Scraping ' + url + '...', { toastId: 'scraping', autoClose: false });
    try {
      const r = await fetch(SCRAPE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(120_000),
      });
      toast.dismiss('scraping');
      if (!r.ok) return msg;
      const { data } = await r.json();
      const s = data?.scraped;
      if (!s?.pages?.length) return msg;

      let injection = `\n\n=== SCRAPED: ${url} ===\n`;
      injection += `Phone: ${s.contact?.phone || 'N/A'} | Email: ${s.contact?.email || 'N/A'}\n`;
      injection += `Logo: ${s.logo || 'none'}\n`;
      for (const p of s.pages.slice(0, 10)) {
        const path = p.url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/';
        const h1 = p.headings?.find((h: { level: number; text: string }) => h.level === 1)?.text || p.title || '';
        injection += `\nPAGE ${path} — "${h1}"\n`;
        injection += (p.headings || []).map((h: { level: number; text: string }) => `  H${h.level}: ${h.text}`).join('\n') + '\n';
        injection += (p.paragraphs || []).slice(0, 5).map((t: string) => `  ${t}`).join('\n') + '\n';
        const imgs = (p.images || []).filter((i: { url: string }) => i.url?.startsWith('http') && /\.(jpg|jpeg|png|webp)/i.test(i.url));
        if (imgs.length) injection += `  Photos: ${imgs.map((i: { url: string }) => i.url).join(', ')}\n`;
        const vids = p.videos || [];
        if (vids.length) injection += `  Videos: ${vids.map((v: { type: string; url: string }) => `${v.type}:${v.url}`).join(', ')}\n`;
      }
      injection += '=== END ===';
      toast.success(`Scraped ${s.pages.length} pages`, { autoClose: 3000 });
      return msg + injection;
    } catch {
      toast.dismiss('scraping');
      toast.warning('Scraping failed — generating without content');
      return msg;
    }
  }

  // ── Send message ─────────────────────────────────────────────────────────

  const doSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg && attachments.length === 0) return;
    if (streaming) return;

    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setMessages(prev => [...prev, { role: 'user', text: text ?? input }]);
    setStreaming(true);

    const enriched = await scrapeAndEnrich(msg);
    const token = localStorage.getItem('mc_token');

    try {
      const res = await fetch(`${API}/portal/projects/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({
          message: enriched,
          attachments: currentAttachments.map(a => ({
            type: a.type.startsWith('image') ? 'image' : 'pdf',
            mediaType: a.type,
            data: a.data,
            name: a.name,
          })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        if (res.status === 401) { window.location.href = '/login'; return; }
        if (res.status === 402) { toast.error('Crediti esauriti. Vai su /billing'); return; }
        throw new Error(`${res.status}: ${errText.slice(0, 200)}`);
      }
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let aiText = '';
      let changedFiles: string[] = [];
      setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const ev = JSON.parse(data);
            if (ev.type === 'text') {
              aiText += ev.content;
              const display = aiText.replace(/<boltAction[\s\S]*?<\/boltAction>/g, '').trim();
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') return [...prev.slice(0, -1), { ...last, text: display }];
                return [...prev, { role: 'assistant', text: display }];
              });
            } else if (ev.type === 'done') {
              changedFiles = ev.changedFiles || [];
              if (changedFiles.length > 0) {
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') return [...prev.slice(0, -1), { ...last, files: changedFiles }];
                  return prev;
                });
              }
            } else if (ev.type === 'error') {
              throw new Error(ev.error);
            }
          } catch {
            // skip malformed SSE
          }
        }
      }

      if (changedFiles.length > 0) {
        const r2 = await fetch(`${API}/portal/projects/${id}`, { headers: { Authorization: `Bearer ${token || ''}` } });
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2?.data?.files) setFiles(d2.data.files);
        }
        setIframeKey(k => k + 1);
        toast.success(`${changedFiles.length} file aggiornati`, { autoClose: 2000 });
      } else if (aiText.length > 0 && aiText.includes('<boltAction')) {
        setIframeKey(k => k + 1);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Errore sconosciuto';
      toast.error('Errore: ' + errMsg);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.text) return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setStreaming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, attachments, streaming, id]);

  // ── Deploy ───────────────────────────────────────────────────────────────

  async function deploy() {
    if (deploying || Object.keys(files).length === 0) return;
    setDeploying(true);
    const token = localStorage.getItem('mc_token');
    try {
      const r = await fetch(`${API}/portal/projects/${id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ files, forceStatic: !('package.json' in files) }),
      });
      const d = await r.json();
      if (d.success && d.data?.deployUrl) {
        setDeployUrl(d.data.deployUrl);
        setIframeKey(k => k + 1);
        toast.success('Sito pubblicato!', { autoClose: 3000 });
      } else {
        toast.error(d.error || 'Deploy fallito');
      }
    } catch {
      toast.error('Errore di rete');
    } finally {
      setDeploying(false);
    }
  }

  // ── File attachment ──────────────────────────────────────────────────────

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      const data = result.split(',')[1] ?? '';
      const preview = isImage ? result : undefined;
      setAttachments(prev => [...prev, { name: f.name, type: f.type, data, preview }]);
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  // ── Save project name ────────────────────────────────────────────────────

  async function saveProjectName(name: string) {
    setEditingName(false);
    if (!name.trim() || name === projectName) return;
    setProjectName(name);
    const token = localStorage.getItem('mc_token');
    try {
      await fetch(`${API}/portal/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ name }),
      });
    } catch {
      // silent
    }
  }

  // ── Key handler ──────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      doSend();
    }
  }

  // ── Sorted file names ────────────────────────────────────────────────────

  const fileNames = Object.keys(files).sort();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a', color: '#e5e7eb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ height: 48, minHeight: 48, background: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', gap: 12 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/?exit=1" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 18, lineHeight: 1 }} title="Back">&larr;</a>
          <span style={{ fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MadeCreative</span>
        </div>

        {/* Center — project name */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          {editingName ? (
            <input
              autoFocus
              defaultValue={projectName}
              onBlur={e => saveProjectName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveProjectName((e.target as HTMLInputElement).value); }}
              style={{ background: '#1e2433', border: '1px solid #374151', borderRadius: 6, padding: '4px 10px', color: '#e5e7eb', fontSize: 14, textAlign: 'center', outline: 'none', width: 200 }}
            />
          ) : (
            <span onClick={() => setEditingName(true)} style={{ cursor: 'pointer', color: '#d1d5db', fontSize: 14, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }} title="Click to rename">
              {projectName || 'Untitled'}
            </span>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/studio/new" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13, padding: '6px 12px', border: '1px solid #374151', borderRadius: 6, background: 'transparent' }}>+ Nuovo</a>
          <button onClick={deploy} disabled={deploying || Object.keys(files).length === 0} style={{ background: deploying ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: deploying ? 'not-allowed' : 'pointer', opacity: Object.keys(files).length === 0 ? 0.5 : 1 }}>
            {deploying ? 'Publishing...' : 'Deploy'}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Chat Panel (40%) ─────────────────────────────────────────── */}
        <div style={{ width: '40%', minWidth: 320, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1f2937' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 60, fontSize: 14, lineHeight: 1.8 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>&#9997;</div>
                <div style={{ fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>MadeCreative Studio</div>
                <div>Scrivi un messaggio per iniziare.</div>
                <div style={{ fontSize: 13, marginTop: 8, color: '#4b5563' }}>Es: &quot;ricostruisci www.miosito.it&quot;</div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.6,
                  ...(m.role === 'user'
                    ? { background: '#1e1b4b', border: '1px solid #3730a3', borderBottomRightRadius: 4 }
                    : { background: '#131c2e', border: '1px solid #1f2937', borderBottomLeftRadius: 4 }),
                }}>
                  {m.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMd(m.text || '') }} />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                  )}
                  {/* File chips */}
                  {m.files && m.files.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {m.files.map((f, fi) => (
                        <span key={fi} onClick={() => { setSelectedFile(f); setActiveTab('code'); }} style={{ background: '#1f2937', color: '#a5b4fc', fontSize: 11, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid #374151' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {streaming && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#131c2e', border: '1px solid #1f2937', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span className="dot-1" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'dotPulse 1.4s ease-in-out infinite' }} />
                  <span className="dot-2" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'dotPulse 1.4s ease-in-out 0.2s infinite' }} />
                  <span className="dot-3" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'dotPulse 1.4s ease-in-out 0.4s infinite' }} />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div style={{ padding: '8px 16px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {attachments.map((a, i) => (
                <div key={i} style={{ position: 'relative', background: '#1f2937', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {a.preview ? (
                    <img src={a.preview} alt={a.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{a.name}</span>
                  )}
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div style={{ padding: 12, borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {/* Attachment buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer', padding: 4 }} title="Attach file">&#128206;</button>
              <button onClick={() => imageInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer', padding: 4 }} title="Attach image">&#128247;</button>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv,.json,.html,.css,.js,.ts,.tsx" hidden onChange={e => handleFileInput(e, false)} />
              <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={e => handleFileInput(e, true)} />
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio... (Ctrl+Enter per inviare)"
              rows={1}
              style={{ flex: 1, background: '#1e2433', border: '1px solid #374151', borderRadius: 8, padding: '10px 12px', color: '#e5e7eb', fontSize: 14, resize: 'none', outline: 'none', lineHeight: 1.5, maxHeight: 150, fontFamily: 'inherit' }}
            />

            <button
              onClick={() => doSend()}
              disabled={streaming || (!input.trim() && attachments.length === 0)}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: (streaming || (!input.trim() && attachments.length === 0)) ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: 16, cursor: (streaming || (!input.trim() && attachments.length === 0)) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              title="Send"
            >
              &#8593;
            </button>
          </div>
        </div>

        {/* ── Preview Panel (60%) ──────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>

          {/* Tabs */}
          <div style={{ height: 40, minHeight: 40, display: 'flex', alignItems: 'center', borderBottom: '1px solid #1f2937', padding: '0 12px', gap: 4 }}>
            {(['preview', 'code'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#1f2937' : 'transparent',
                  color: activeTab === tab ? '#e5e7eb' : '#6b7280',
                  border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
                }}
              >
                {tab === 'preview' ? 'Preview' : 'Code'}
              </button>
            ))}
            {deployUrl && (
              <a href={deployUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 12, textDecoration: 'none' }}>
                {deployUrl.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          {/* Tab content */}
          {activeTab === 'preview' ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {deployUrl ? (
                <iframe
                  key={iframeKey}
                  src={deployUrl}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                  title="Preview"
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#4b5563', fontSize: 14 }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>&#127760;</div>
                  <div>Genera il sito e clicca Deploy</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: '#374151' }}>per visualizzare l&apos;anteprima qui</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* File tree */}
              <div style={{ width: '30%', minWidth: 160, borderRight: '1px solid #1f2937', overflowY: 'auto', padding: '8px 0' }}>
                {fileNames.length === 0 ? (
                  <div style={{ color: '#4b5563', fontSize: 13, padding: '16px 12px', textAlign: 'center' }}>Nessun file</div>
                ) : (
                  fileNames.map(name => (
                    <div
                      key={name}
                      onClick={() => setSelectedFile(name)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        color: selectedFile === name ? '#a5b4fc' : '#9ca3af',
                        background: selectedFile === name ? '#1f2937' : 'transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: 'monospace',
                      }}
                    >
                      {name}
                    </div>
                  ))
                )}
              </div>

              {/* File content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {selectedFile && files[selectedFile] ? (
                  <pre style={{ margin: 0, fontSize: 13, color: '#d1d5db', fontFamily: '"Fira Code", "Cascadia Code", monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {files[selectedFile]}
                  </pre>
                ) : (
                  <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                    Seleziona un file dalla lista
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Keyframe animation for dots ────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      ` }} />
    </div>
  );
}
