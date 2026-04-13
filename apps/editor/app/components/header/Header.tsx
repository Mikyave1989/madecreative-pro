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

  return (
    <div className="flex items-center gap-3 ml-auto">
      {creditInfo && (
        <span className="text-xs text-bolt-elements-textTertiary hidden sm:block">
          {creditInfo.remaining} credits
        </span>
      )}
      <a
        href="/billing"
        className="text-xs text-indigo-400 hover:text-indigo-300 hidden sm:block"
      >
        {user.plan}
      </a>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
          {user.contactName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
          title="Logout"
        >
          <div className="i-ph:sign-out text-lg" />
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center px-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          <span style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:700,fontSize:"1.1rem"}}>MadeCreative</span>
        </a>
      </div>
      {chat.started && (
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
      <ClientOnly>{() => <UserMenu />}</ClientOnly>
    </header>
  );
}
