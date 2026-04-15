import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Landing } from '~/components/landing/Landing';
import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import { authUser } from '~/lib/stores/auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'MadeCreative — AI Website Builder' },
    { name: 'description', content: 'Build stunning websites with AI in minutes. React, animations, responsive design — all generated in real-time.' },
  ];
};

export const loader = () => json({});

export default function Index() {
  return (
    <ClientOnly fallback={<Landing />}>
      {() => <IndexClient />}
    </ClientOnly>
  );
}

function IndexClient() {
  const user = useStore(authUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  return <Landing />;
}
