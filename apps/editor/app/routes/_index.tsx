import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { Landing } from '~/components/landing/Landing';
import { useStore } from '@nanostores/react';
import { useNavigate, useSearchParams, useLocation } from '@remix-run/react';
import { useEffect } from 'react';
import { authUser } from '~/lib/stores/auth';
import { activeProjectId, loadProjects } from '~/lib/stores/projects';
import { apiClient } from '~/lib/api/client';
import { workbenchStore } from '~/lib/stores/workbench';
import { openDatabase, createChatFromMessages } from '~/lib/persistence/db';
import { generateId } from 'ai';

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
    // chat.$id.tsx re-exports this component, so without this guard
    // navigating to /chat/:id would trigger a redirect back to /?project=xxx
    // causing an infinite loop: /?project → /chat/:id → /?project → ...
    if (location.pathname !== '/') return;

    const token = localStorage.getItem('mc_token');
    if (!token) return;

    const persistedProjectId = localStorage.getItem('mc_active_project_id');
    if (persistedProjectId) {
      navigate(`/?project=${persistedProjectId}`);
    }
  }, [user, projectParam, location.pathname]);

  useEffect(() => {
    if (!user || !projectParam) return;
    // Only load when at /?project=xxx — not when chat.$id.tsx renders this
    // component at /chat/:id (which has no ?project param anyway, but guard
    // against edge cases where both could coexist).
    if (location.pathname !== '/') return;

    activeProjectId.set(projectParam);

    // Load project files from API and inject into the bolt.diy workbench.
    // Bolt loads files by replaying a synthetic assistant message that
    // contains <boltArtifact>/<boltAction type="file"> tags — same format
    // as the snapshot-restore mechanism.  Navigate to /chat/:id so the
    // action runner writes files to WebContainers and the AI has full context.
    apiClient<{ files: Record<string, string>; name: string }>(
      `/portal/projects/${projectParam}`,
    ).then(async (res) => {
      if (!res.success || !res.data?.files) return;

      const files = res.data.files;
      if (Object.keys(files).length === 0) return;

      const projectName = res.data.name || 'Progetto';

      const fileActions = Object.entries(files)
        .map(([filePath, content]) => `<boltAction type="file" filePath="${filePath}">\n${content}\n</boltAction>`)
        .join('\n');

      const assistantContent = `Ho caricato il progetto "${projectName}" nel workbench. Puoi chiedermi di modificare qualsiasi parte del sito.
<boltArtifact id="project-restore" title="${projectName}" type="bundled">
${fileActions}
</boltArtifact>`;

      const messages = [
        {
          id: generateId(),
          role: 'user' as const,
          content: `Carica il progetto: ${projectName}`,
          annotations: ['hidden' as any],
        },
        {
          id: generateId(),
          role: 'assistant' as const,
          content: assistantContent,
        },
      ];

      try {
        const db = await openDatabase();
        if (!db) return;

        const chatId = await createChatFromMessages(db, projectName, messages);
        navigate(`/chat/${chatId}`);
      } catch (err) {
        console.error('[IndexClient] Failed to create project chat:', err);
      }
    });
  }, [user, projectParam, location.pathname]);

  if (!user) {
    return <Landing />;
  }

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <Chat />
    </div>
  );
}
