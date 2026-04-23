import { useEffect, useRef, useState } from 'react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';

export const meta: MetaFunction = () => [
  { title: 'Checkout — MadeCreative' },
  { name: 'robots', content: 'noindex' },
];

export default function PayPage() {
  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4">
      <ClientOnly fallback={<Spinner />}>
        {() => <EmbeddedCheckoutClient />}
      </ClientOnly>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  );
}

function EmbeddedCheckoutClient() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Helper: if Stripe.js can't load (Firefox ETP, ad-blocker, proxy), redirect
  // to the hosted checkout (top-level navigation, not a blocked third-party
  // script). We pass the URL through from the backend via ?fb=<encoded>.
  const triggerFallback = (reason: string) => {
    const params = new URLSearchParams(window.location.search);
    const fb = params.get('fb');
    if (fb) {
      window.location.href = fb;
      return true;
    }
    setError(reason);
    return false;
  };

  useEffect(() => {
    let checkout: { destroy: () => void } | null = null;
    let cancelled = false;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const clientSecret = params.get('cs');
        const fb = params.get('fb');
        if (fb) setFallbackUrl(fb);

        if (!clientSecret) {
          setError('Missing checkout session. Please start again from the pricing page.');
          setLoading(false);
          return;
        }

        const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
        if (!pk || !pk.startsWith('pk_')) {
          setError('Stripe publishable key is not configured.');
          setLoading(false);
          return;
        }

        // Probe js.stripe.com. If it's blocked (Firefox ETP / ad-blocker /
        // proxy) we can't use Embedded Checkout — redirect to hosted.
        try {
          await fetch('https://js.stripe.com/v3/', { mode: 'no-cors' });
        } catch {
          if (triggerFallback('Il tuo browser sta bloccando Stripe.js (probabile Firefox Enhanced Tracking Protection o un ad-blocker). Reindirizzamento a Stripe in corso...')) {
            return;
          }
          setLoading(false);
          return;
        }

        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(pk);
        if (!stripe) {
          if (triggerFallback('Stripe.js non inizializzato. Reindirizzamento a Stripe in corso...')) {
            return;
          }
          setLoading(false);
          return;
        }

        if (cancelled) return;

        checkout = await stripe.initEmbeddedCheckout({ clientSecret });
        if (cancelled) {
          checkout.destroy();
          return;
        }

        if (mountRef.current) {
          checkout.mount(mountRef.current);
        }
        setLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!triggerFallback('Errore durante il caricamento del checkout. Reindirizzamento a Stripe...\n\n' + msg)) {
          setError(msg);
        }
        setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      if (checkout) checkout.destroy();
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-md w-full rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-3">Problema nel caricamento del checkout</h2>
        <p className="text-sm text-red-200 mb-4 whitespace-pre-wrap">{error}</p>
        <div className="text-center">
          <a
            href="/#pricing"
            className="inline-block text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Torna ai prezzi
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}
      <div ref={mountRef} />
    </div>
  );
}
