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

    const token = localStorage.getItem('mc_token');
    if (!token) return;

    const persistedProjectId = localStorage.getItem('mc_active_project_id');
    if (persistedProjectId) {
      navigate('/studio/' + persistedProjectId);
    }
  }, [user, projectParam, location.pathname]);

  useEffect(() => {
    if (!user || !projectParam) return;
    if (location.pathname !== '/') return;
    activeProjectId.set(projectParam);
    navigate('/studio/' + projectParam);
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
