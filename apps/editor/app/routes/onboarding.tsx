import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useSearchParams, useNavigate } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { setTokens, API_URL } from '~/lib/api/client';
import { setAuth, type McUser } from '~/lib/stores/auth';

export const meta: MetaFunction = () => [
  { title: 'Setting up your workspace — MadeCreative' },
  { name: 'robots', content: 'noindex' },
];

export const loader = () => json({});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Stage = 'loading' | 'success' | 'error';

interface VerifyResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: McUser;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 'payment',    label: 'Payment confirmed' },
  { id: 'workspace',  label: 'Creating workspace' },
  { id: 'ready',      label: 'Ready!'             },
] as const;

type StepId = (typeof STEPS)[number]['id'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifySession(sessionId: string): Promise<VerifyResponse> {
  const res = await fetch(`${API_URL}/public/signup/verify-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { success: false, error: text || `HTTP ${res.status}` };
  }

  return res.json() as Promise<VerifyResponse>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id') ?? '';

  const [stage, setStage] = useState<Stage>('loading');
  const [activeStep, setActiveStep] = useState<StepId>('payment');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');

  // Guard against React double-invoke in dev
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!sessionId) {
      setErrorMessage('No session ID found. Please complete checkout first.');
      setStage('error');
      return;
    }

    let cancelled = false;

    (async () => {
      // Step 1 — payment already confirmed on landing
      setActiveStep('payment');
      await sleep(600);

      if (cancelled) return;

      // Step 2 — call the API (with retries)
      setActiveStep('workspace');

      let lastError = 'Verification failed. Please try again.';
      let result: VerifyResponse | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          result = await verifySession(sessionId);

          if (result.success && result.data) break;

          lastError = result.error || lastError;
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : 'Network error';
        }

        if (attempt < MAX_RETRIES - 1) await sleep(RETRY_DELAY_MS);
      }

      if (cancelled) return;

      if (!result?.success || !result.data) {
        setErrorMessage(lastError);
        setStage('error');
        return;
      }

      // Commit auth state
      const { accessToken, refreshToken, user } = result.data;
      setTokens(accessToken, refreshToken);
      setAuth(user);
      setUserName(user.contactName || user.email);

      // Step 3 — show success
      setActiveStep('ready');
      setStage('success');

      await sleep(2200);
      if (!cancelled) navigate('/', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  // ---------------------------------------------------------------------------
  // Derived display state
  // ---------------------------------------------------------------------------

  const activeStepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-bolt-elements-background-depth-1"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Ambient gradient blobs */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '55vw',
            height: '55vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-2xl overflow-hidden"
      >
        {/* Top gradient accent bar */}
        <div
          style={{
            height: 4,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
          }}
        />

        <div className="px-8 py-10">
          {/* Logo + wordmark */}
          <div className="flex flex-col items-center mb-10">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MadeCreative
            </h1>
          </div>

          {/* ----- LOADING / PROGRESS STATE ----- */}
          {stage === 'loading' && (
            <>
              <div className="text-center mb-8">
                <p className="text-lg font-semibold text-bolt-elements-textPrimary">
                  Setting up your workspace...
                </p>
                <p className="text-sm text-bolt-elements-textSecondary mt-1">
                  This takes just a moment
                </p>
              </div>

              {/* Spinner */}
              <div className="flex justify-center mb-8">
                <div
                  className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
                  style={{ borderColor: '#6366f1 transparent transparent transparent' }}
                />
              </div>

              {/* Progress steps */}
              <StepTracker steps={STEPS} activeIndex={activeStepIndex} stage={stage} />
            </>
          )}

          {/* ----- SUCCESS STATE ----- */}
          {stage === 'success' && (
            <>
              <div className="text-center mb-8">
                {/* Animated checkmark */}
                <div className="flex justify-center mb-5">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow: '0 0 32px rgba(99,102,241,0.45)',
                      animation: 'mc-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                    }}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      style={{ animation: 'mc-draw-check 0.5s ease 0.2s both' }}
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="20"
                        strokeDashoffset="0"
                      />
                    </svg>
                  </div>
                </div>

                <p className="text-xl font-bold text-bolt-elements-textPrimary">
                  Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
                </p>
                <p className="text-sm text-bolt-elements-textSecondary mt-1">
                  Your workspace is ready. Taking you there now...
                </p>
              </div>

              {/* Steps — all complete */}
              <StepTracker steps={STEPS} activeIndex={STEPS.length} stage={stage} />

              {/* Redirect progress bar */}
              <div
                className="mt-6 h-1 rounded-full overflow-hidden"
                style={{ background: 'var(--bolt-elements-borderColor)' }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    animation: 'mc-progress 2.2s linear forwards',
                    transformOrigin: 'left',
                  }}
                />
              </div>
            </>
          )}

          {/* ----- ERROR STATE ----- */}
          {stage === 'error' && (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
                      <path
                        d="M12 7v5M12 16h.01"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                <p className="text-lg font-semibold text-bolt-elements-textPrimary">
                  Verification failed
                </p>
                <p className="text-sm text-bolt-elements-textSecondary mt-2 leading-relaxed">
                  {errorMessage || 'We could not activate your account. Please try again or contact support.'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    hasRun.current = false;
                    setStage('loading');
                    setActiveStep('payment');
                    setErrorMessage('');
                  }}
                  className="w-full py-2.5 px-4 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Try again
                </button>

                <a
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-lg text-center text-sm font-medium transition-colors text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
                >
                  Go back to login
                </a>

                <p className="text-center text-xs text-bolt-elements-textTertiary mt-1">
                  Need help?{' '}
                  <a
                    href="mailto:support@madecreative.pro"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Contact support
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes mc-pop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes mc-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes mc-step-in {
          from { transform: translateX(-6px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepTracker sub-component
// ---------------------------------------------------------------------------

interface StepTrackerProps {
  steps: typeof STEPS;
  activeIndex: number;
  stage: Stage;
}

function StepTracker({ steps, activeIndex, stage }: StepTrackerProps) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const isDone    = i < activeIndex;
        const isCurrent = i === activeIndex && stage === 'loading';
        const isPending = i > activeIndex;

        return (
          <li
            key={step.id}
            className="flex items-center gap-3"
            style={{
              animation: `mc-step-in 0.3s ease ${i * 80}ms both`,
              opacity: isPending ? 0.45 : 1,
            }}
          >
            {/* Status icon */}
            <div
              className="flex-none flex items-center justify-center w-7 h-7 rounded-full"
              style={{
                background: isDone
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : isCurrent
                  ? 'rgba(99,102,241,0.15)'
                  : 'var(--bolt-elements-background-depth-3)',
                border: isCurrent ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.3s ease',
              }}
            >
              {isDone ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 7l3 3 5-6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : isCurrent ? (
                <div
                  className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#6366f1 transparent transparent transparent' }}
                />
              ) : (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--bolt-elements-textTertiary)' }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-sm font-medium"
              style={{
                color: isDone || isCurrent
                  ? 'var(--bolt-elements-textPrimary)'
                  : 'var(--bolt-elements-textTertiary)',
              }}
            >
              {step.label}
            </span>

            {/* "Completed" badge on done items */}
            {isDone && (
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  color: '#818cf8',
                }}
              >
                done
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
