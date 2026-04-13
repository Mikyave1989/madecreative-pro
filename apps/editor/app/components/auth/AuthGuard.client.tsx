import { useEffect } from 'react';
import { useNavigate, useLocation } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import { authUser, authLoading, initAuth } from '~/lib/stores/auth';

const PUBLIC_ROUTES = ['/login', '/signup', '/', '/onboarding'];
const PUBLIC_PREFIXES = ['/admin'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useStore(authUser);
  const loading = useStore(authLoading);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic =
      PUBLIC_ROUTES.some((r) => location.pathname === r) ||
      PUBLIC_PREFIXES.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));

    if (!user && !isPublic) {
      navigate('/login', { replace: true });
    } else if (user && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bolt-elements-background-depth-1">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-bolt-elements-textSecondary text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
