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

  useEffect(() => {
    let checkout: { destroy: () => void } | null = null;
    let cancelled = false;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const clientSecret = params.get('cs');

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

        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(pk);
        if (!stripe) {
          setError('Failed to load Stripe.');
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
        setError(msg);
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
      <div className="max-w-md w-full rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Checkout error</h2>
        <p className="text-sm text-red-200 mb-4">{error}</p>
        <a
          href="/#pricing"
          className="inline-block px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
        >
          Back to pricing
        </a>
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
