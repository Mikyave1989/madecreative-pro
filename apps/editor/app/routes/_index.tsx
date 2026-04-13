import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { Landing } from '~/components/landing/Landing';
import { useStore } from '@nanostores/react';
import { useSearchParams } from '@remix-run/react';
import { useEffect } from 'react';
import { authUser } from '~/lib/stores/auth';
import { activeProjectId, loadProjects } from '~/lib/stores/projects';
import { apiClient } from '~/lib/api/client';
import { workbenchStore } from '~/lib/stores/workbench';

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
  const projectParam = searchParams.get('project');

  useEffect(() => {
    if (user && projectParam) {
      activeProjectId.set(projectParam);

      // Load project files from API and inject into workbench
      apiClient<{ files: Record<string, string>; name: string; companyName: string; sector: string }>(
        `/portal/projects/${projectParam}`,
      ).then((res) => {
        if (res.success && res.data?.files) {
          const files = res.data.files;
          const fileCount = Object.keys(files).length;

          if (fileCount > 0) {
            console.log(`Loaded ${fileCount} files from project ${projectParam}`);
          }
        }
      });
    }
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
