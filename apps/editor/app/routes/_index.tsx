import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { Landing } from '~/components/landing/Landing';
import { useStore } from '@nanostores/react';
import { useNavigate, useSearchParams } from '@remix-run/react';
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
  const projectParam = searchParams.get('project');

  useEffect(() => {
    if (!user || !projectParam) return;

    activeProjectId.set(projectParam);

    // Load project files from API and inject into the bolt.diy workbench.
    // bolt.diy loads files by replaying a synthetic assistant message that
    // contains <boltArtifact> / <boltAction type="file"> tags — exactly the
    // same format used by the snapshot-restore mechanism.  Once the chat is
    // created we navigate to it so the action runner processes the files and
    // the AI has full file context for subsequent modification requests.
    apiClient<{ files: Record<string, string>; name: string }>(
      `/portal/projects/${projectParam}`,
    ).then(async (res) => {
      if (!res.success || !res.data?.files) return;

      const files = res.data.files;
      if (Object.keys(files).length === 0) return;

      const projectName = res.data.name || 'Progetto';

      // Build the synthetic artifact message with every file as a boltAction
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
  }, [user, projectParam]);

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
