import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { Landing } from '~/components/landing/Landing';
import { useStore } from '@nanostores/react';
import { useNavigate, useSearchParams, useLocation } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { authUser } from '~/lib/stores/auth';
import { activeProjectId } from '~/lib/stores/projects';

export const meta: MetaFunction = () => {
  return [
    { title: 'MadeCreative — AI Website Builder' },
    { name: 'description', content: 'Build stunning websites with AI in minutes. React, animations, responsive design — all generated in real-time.' },
  ];
};

export const loader = () => json({});

export default function Index() {
  return (
    <ClientOnly fallback={<LandingFallback />}>
      {() => <IndexClient />}
    </ClientOnly>
  );
}

function LandingFallback() {
  return <Landing />;
}

function IndexClient() {
  const user = useStore(authUser);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const projectParam = searchParams.get('project');

  useEffect(() => {
    if (!user) return;
    if (projectParam) return;
    // Only auto-redirect from the root "/" — NOT from /chat/:id.
    if (location.pathname !== '/') return;

    // If user explicitly exited the editor, clear active project and stay on launcher
    const exitParam = searchParams.get('exit');
    if (exitParam) {
      localStorage.removeItem('mc_active_project_id');
      // Clean the URL so a refresh doesn't keep the exit param
      window.history.replaceState({}, '', '/');
      return;
    }

    const token = localStorage.getItem('mc_token');
    if (!token) return;

    const persistedProjectId = localStorage.getItem('mc_active_project_id');
    if (persistedProjectId) {
      navigate('/studio/' + persistedProjectId);
    }
  }, [user, projectParam, location.pathname, searchParams]);

  useEffect(() => {
    if (!user || !projectParam) return;
    if (location.pathname !== '/') return;
    activeProjectId.set(projectParam);
    navigate('/studio/' + projectParam);
  }, [user, projectParam, location.pathname]);

  if (!user) {
    return <Landing />;
  }

  // Logged in but no project to redirect to — show project launcher
  return <ProjectLauncher navigate={navigate} />;
}

function ProjectLauncher({ navigate }: { navigate: (path: string) => void }) {
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: no token → redirect to login immediately
  useEffect(() => {
    const token = localStorage.getItem('mc_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleCreate = async () => {
    const token = localStorage.getItem('mc_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setCreating(true);
    setError(null);
    const API_URL = 'https://api.madecreative.pro';

    // Name from URL or default
    let name = 'Nuovo Sito';
    const urlMatch = url.trim().match(/([a-z0-9-]+)\.[a-z]{2,}/i);
    if (urlMatch) name = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    try {
      const res = await fetch(`${API_URL}/portal/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });

      if (res.status === 401) {
        localStorage.removeItem('mc_token');
        localStorage.removeItem('mc_refresh_token');
        localStorage.removeItem('mc_active_project_id');
        navigate('/login');
        return;
      }

      const data = await res.json() as { success: boolean; data?: { id: string }; error?: string };
      if (data.success && data.data?.id) {
        localStorage.setItem('mc_active_project_id', data.data.id);
        // Navigate to studio with the URL pre-filled if provided
        const target = url.trim()
          ? `/studio/${data.data.id}?rebuild=${encodeURIComponent(url.trim())}`
          : `/studio/${data.data.id}`;
        navigate(target);
      } else {
        setError(data.error ?? 'Errore durante la creazione del progetto. Riprova.');
        setCreating(false);
      }
    } catch {
      setError('Errore di rete. Controlla la connessione e riprova.');
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '32px', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '8px' }}>
          MadeCreative Studio
        </div>
        <div style={{ color: '#6b7280', fontSize: '15px' }}>Ricostruisci un sito o inizia da zero</div>
      </div>
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ background: '#1f0f0f', border: '1px solid #7f1d1d', borderRadius: '8px', color: '#f87171', fontSize: '13px', padding: '10px 14px' }}>
            {error}
          </div>
        )}
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
            URL sito da ricostruire (opzionale)
          </label>
          <input
            type="text"
            placeholder="es. www.mioristorante.it"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !creating && handleCreate()}
            style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb', fontSize: '14px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{ background: creating ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: creating ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {creating ? 'Creazione in corso...' : url ? 'Ricostruisci sito' : 'Nuovo progetto vuoto'}
        </button>
      </div>
      <div style={{ color: '#374151', fontSize: '12px' }}>
        Oppure seleziona un progetto esistente dal menu laterale
      </div>
    </div>
  );
}
