import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useStore } from '@nanostores/react';
import { netlifyConnection } from '~/lib/stores/netlify';
import { vercelConnection } from '~/lib/stores/vercel';
import { isGitLabConnected } from '~/lib/stores/gitlabConnection';
import { workbenchStore } from '~/lib/stores/workbench';
import { streamingState } from '~/lib/stores/streaming';
import { classNames } from '~/utils/classNames';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { NetlifyDeploymentLink } from '~/components/chat/NetlifyDeploymentLink.client';
import { VercelDeploymentLink } from '~/components/chat/VercelDeploymentLink.client';
import { useVercelDeploy } from '~/components/deploy/VercelDeploy.client';
import { useNetlifyDeploy } from '~/components/deploy/NetlifyDeploy.client';
import { useGitHubDeploy } from '~/components/deploy/GitHubDeploy.client';
import { useGitLabDeploy } from '~/components/deploy/GitLabDeploy.client';
import { GitHubDeploymentDialog } from '~/components/deploy/GitHubDeploymentDialog';
import { GitLabDeploymentDialog } from '~/components/deploy/GitLabDeploymentDialog';
import { authUser } from '~/lib/stores/auth';
import { activeProjectId } from '~/lib/stores/projects';
import { isAuthenticated } from '~/lib/api/client';

interface DeployButtonProps {
  onVercelDeploy?: () => Promise<void>;
  onNetlifyDeploy?: () => Promise<void>;
  onGitHubDeploy?: () => Promise<void>;
  onGitLabDeploy?: () => Promise<void>;
}

export const DeployButton = ({
  onVercelDeploy,
  onNetlifyDeploy,
  onGitHubDeploy,
  onGitLabDeploy,
}: DeployButtonProps) => {
  const netlifyConn = useStore(netlifyConnection);
  const vercelConn = useStore(vercelConnection);
  const gitlabIsConnected = useStore(isGitLabConnected);
  const user = useStore(authUser);
  const projectId = useStore(activeProjectId);
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployingTo, setDeployingTo] = useState<'netlify' | 'vercel' | 'github' | 'gitlab' | 'madecreative' | null>(null);
  const [mcDeployUrl, setMcDeployUrl] = useState<string | null>(null);
  const isStreaming = useStore(streamingState);
  const { handleVercelDeploy } = useVercelDeploy();
  const { handleNetlifyDeploy } = useNetlifyDeploy();
  const { handleGitHubDeploy } = useGitHubDeploy();
  const { handleGitLabDeploy } = useGitLabDeploy();
  const [showGitHubDeploymentDialog, setShowGitHubDeploymentDialog] = useState(false);
  const [showGitLabDeploymentDialog, setShowGitLabDeploymentDialog] = useState(false);
  const [githubDeploymentFiles, setGithubDeploymentFiles] = useState<Record<string, string> | null>(null);
  const [gitlabDeploymentFiles, setGitlabDeploymentFiles] = useState<Record<string, string> | null>(null);
  const [githubProjectName, setGithubProjectName] = useState('');
  const [gitlabProjectName, setGitlabProjectName] = useState('');

  const handleMcDeployClick = async () => {
    if (!user) {
      toast.error('Devi essere loggato per pubblicare.');
      return;
    }

    setIsDeploying(true);
    setDeployingTo('madecreative');

    try {
      // Collect all files from the workbench
      const allFiles = workbenchStore.files.get();
      const files: Record<string, string> = {};

      for (const [path, dirent] of Object.entries(allFiles)) {
        if (dirent?.type === 'file' && dirent.content) {
          const cleanPath = path.replace(/^\/home\/project\//, '');
          files[cleanPath] = dirent.content;
        }
      }

      if (Object.keys(files).length === 0) {
        toast.error('Nessun file da pubblicare. Genera prima il sito.');
        setIsDeploying(false);
        setDeployingTo(null);
        return;
      }

      const token = localStorage.getItem('mc_token');
      let deployProjectId = projectId;

      // Auto-create project if none exists (e.g. after rebuilding from URL)
      if (!deployProjectId) {
        if (!token) {
          // Not logged into MadeCreative backend — deploy via Vercel directly
          toast.info('Pubblicazione in corso...', { autoClose: 2000 });
          // Collect files and deploy directly without a project ID
          const apiBase = 'https://api.madecreative.pro';
          const VERCEL_PROJECT = `mc-editor-${Date.now()}`;
          try {
            const encFiles = Object.entries(files).slice(0, 50).map(([file, content]) => ({
              file, data: btoa(unescape(encodeURIComponent(content))), encoding: 'base64',
            }));
            const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_VERCEL_TOKEN || ''}` },
              body: JSON.stringify({ name: VERCEL_PROJECT, files: encFiles, projectSettings: { framework: null, buildCommand: '', outputDirectory: '.' }, target: 'production', public: true }),
            });
            if (deployRes.ok) {
              const dep = await deployRes.json() as { url: string };
              setMcDeployUrl(`https://${dep.url}`);
              toast.success('Sito pubblicato!', { autoClose: 3000 });
              setIsDeploying(false);
              setDeployingTo(null);
              return;
            }
          } catch {}
          toast.error('Accedi per pubblicare il sito.');
          setIsDeploying(false);
          setDeployingTo(null);
          return;
        }
        toast.info('Creazione progetto...', { autoClose: 2000 });
        const apiBase = 'https://api.madecreative.pro';
        let siteName = 'Sito Ricostruito';
        const indexHtml = files['index.html'] || '';
        const titleMatch = indexHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch?.[1]) siteName = titleMatch[1].replace(/\s*[—|–|-].*$/, '').trim().slice(0, 60);

        try {
          const createRes = await fetch(`${apiBase}/portal/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: siteName || 'Nuovo Sito' }),
          });
          const createData = await createRes.json() as { success: boolean; data?: { id: string }; error?: string };
          if (createData.success && createData.data?.id) {
            deployProjectId = createData.data.id;
            activeProjectId.set(deployProjectId);
          } else {
            // If token expired, try to refresh
            toast.error(`Errore: ${createData.error || 'Sessione scaduta. Riaccedi.'}`);
            setIsDeploying(false);
            setDeployingTo(null);
            return;
          }
        } catch {
          toast.error('Errore di rete. Controlla la connessione.');
          setIsDeploying(false);
          setDeployingTo(null);
          return;
        }
      }

      const res = await fetch('/api/mc-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: deployProjectId, files, token }),
      });

      const data = await res.json();

      if (data.success && data.data?.deployUrl) {
        setMcDeployUrl(data.data.deployUrl);
        toast.success('Sito pubblicato! 🚀', { autoClose: 3000 });
      } else {
        toast.error(data.error || 'Pubblicazione fallita');
      }
    } catch (err) {
      toast.error('Pubblicazione fallita. Riprova.');
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleVercelDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('vercel');

    try {
      if (onVercelDeploy) {
        await onVercelDeploy();
      } else {
        await handleVercelDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleNetlifyDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('netlify');

    try {
      if (onNetlifyDeploy) {
        await onNetlifyDeploy();
      } else {
        await handleNetlifyDeploy();
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleGitHubDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('github');

    try {
      if (onGitHubDeploy) {
        await onGitHubDeploy();
      } else {
        const result = await handleGitHubDeploy();

        if (result && result.success && result.files) {
          setGithubDeploymentFiles(result.files);
          setGithubProjectName(result.projectName);
          setShowGitHubDeploymentDialog(true);
        }
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  const handleGitLabDeployClick = async () => {
    setIsDeploying(true);
    setDeployingTo('gitlab');

    try {
      if (onGitLabDeploy) {
        await onGitLabDeploy();
      } else {
        const result = await handleGitLabDeploy();

        if (result && result.success && result.files) {
          setGitlabDeploymentFiles(result.files);
          setGitlabProjectName(result.projectName);
          setShowGitLabDeploymentDialog(true);
        }
      }
    } finally {
      setIsDeploying(false);
      setDeployingTo(null);
    }
  };

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  const handlePublishClick = () => {
    if (!projectId) {
      toast.error('Crea prima un progetto per pubblicarlo.');
      return;
    }
    if (mcDeployUrl) {
      // Already deployed — show URL + domain option
      setShowPublishModal(true);
    } else {
      // First publish — deploy then show modal
      handleMcDeployClick().then(() => setShowPublishModal(true));
    }
  };

  return (
    <>
      {/* Publish modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60" onClick={() => setShowPublishModal(false)}>
          <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl p-6 w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-bolt-elements-textPrimary mb-1">🚀 Pubblica il Sito</h2>
            <p className="text-sm text-bolt-elements-textSecondary mb-4">Il tuo sito sarà live in pochi secondi.</p>

            {mcDeployUrl && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 font-medium mb-1">✅ Sito pubblicato</p>
                <a href={mcDeployUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-bolt-elements-textSecondary hover:text-accent-500 break-all">{mcDeployUrl}</a>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-medium text-bolt-elements-textSecondary mb-2 block">Dominio personalizzato (opzionale)</label>
              <input
                type="text"
                placeholder="mioristorante.it"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <p className="text-xs text-bolt-elements-textTertiary mt-1">Aggiungi un record CNAME al tuo DNS puntando a cname.vercel-dns.com</p>
            </div>

            <div className="flex gap-2">
              {!mcDeployUrl && (
                <button
                  onClick={() => { handleMcDeployClick(); }}
                  disabled={isDeploying}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {isDeploying ? 'Pubblicando...' : '🚀 Pubblica ora'}
                </button>
              )}
              {mcDeployUrl && (
                <a href={mcDeployUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white text-center" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                  🌐 Apri sito live
                </a>
              )}
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 rounded-lg text-sm text-bolt-elements-textSecondary hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden text-sm">
        {/* Single "Pubblica" button — no dropdown */}
        <button
          disabled={isDeploying || isStreaming}
          onClick={handlePublishClick}
          className="rounded-md items-center justify-center disabled:cursor-not-allowed disabled:opacity-60 px-4 py-1.5 text-xs font-semibold text-white flex gap-2"
          style={{ background: isDeploying ? '#6b7280' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {isDeploying ? (
            <><span className="i-ph:spinner animate-spin" />Pubblicando...</>
          ) : mcDeployUrl ? (
            <><span className="i-ph:globe" />Pubblicato ✓</>
          ) : (
            <><span className="i-ph:rocket-launch" />Pubblica</>
          )}
        </button>
        {/* Fake DropdownMenu.Content to satisfy imports */}
        <DropdownMenu.Root>
          <DropdownMenu.Content sideOffset={5} align="end">
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      {/* GitHub Deployment Dialog */}
      {showGitHubDeploymentDialog && githubDeploymentFiles && (
        <GitHubDeploymentDialog
          isOpen={showGitHubDeploymentDialog}
          onClose={() => setShowGitHubDeploymentDialog(false)}
          projectName={githubProjectName}
          files={githubDeploymentFiles}
        />
      )}

      {/* GitLab Deployment Dialog */}
      {showGitLabDeploymentDialog && gitlabDeploymentFiles && (
        <GitLabDeploymentDialog
          isOpen={showGitLabDeploymentDialog}
          onClose={() => setShowGitLabDeploymentDialog(false)}
          projectName={gitlabProjectName}
          files={gitlabDeploymentFiles}
        />
      )}
    </>
  );
};
