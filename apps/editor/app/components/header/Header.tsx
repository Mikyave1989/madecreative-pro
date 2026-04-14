import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { authUser, credits, logout } from '~/lib/stores/auth';

function UserMenu() {
  const user = useStore(authUser);
  const creditInfo = useStore(credits);

  if (!user) return null;

  const initial = user.contactName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 ml-auto">
      {creditInfo && (
        <span
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(99,102,241,0.12)',
            color: 'rgba(165,167,255,0.9)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: '#6366f1' }}
          />
          {creditInfo.remaining} credits
        </span>
      )}
      <a
        href="/billing"
        className="hidden sm:block text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
        }}
      >
        {user.plan}
      </a>
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold select-none"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 0 2px rgba(99,102,241,0.3)',
          }}
        >
          {initial}
        </div>
        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          title="Sign out"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <div className="i-ph:sign-out text-base" />
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center px-5 h-[var(--header-height)]',
        'transition-all duration-300',
      )}
      style={{
        background: '#0d0f14',
        borderBottom: chat.started
          ? '1px solid rgba(255,255,255,0.07)'
          : '1px solid transparent',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 z-logo flex-shrink-0">
        <div className="i-ph:sidebar-simple-duotone text-lg" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <a href="/" className="flex items-center select-none" style={{ textDecoration: 'none' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
            }}
          >
            MadeCreative
          </span>
        </a>
      </div>

      {/* Center: chat title */}
      {chat.started && (
        <span
          className="flex-1 px-6 truncate text-center text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}
        >
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </span>
      )}

      {/* Right: action buttons + user */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {chat.started && (
          <ClientOnly>
            {() => <HeaderActionButtons chatStarted={chat.started} />}
          </ClientOnly>
        )}
        <ClientOnly>{() => <UserMenu />}</ClientOnly>
      </div>
    </header>
  );
}
