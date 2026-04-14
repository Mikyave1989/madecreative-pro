import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { apiClient } from '~/lib/api/client';
import { useStore } from '@nanostores/react';
import { authUser } from '~/lib/stores/auth';

interface BillingData {
  plan: string;
  status: string;
  nextChargeDate: string | null;
  paymentMethod: { brand: string; last4: string } | null;
  creditsUsed: number;
  creditsPurchased: number;
  creditsTotal: number;
  creditsRemaining: number;
  refundEligible: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl: string | null;
}

// Buy extra credits button component
function BuyCreditsButton({ credits, price }: { credits: number; price: number }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ checkoutUrl: string }>('/portal/editor/buy-credits', {
        method: 'POST',
        body: JSON.stringify({ credits, amount: price * 100 }),
      });
      if (res.success && res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
    >
      {loading ? 'Loading...' : 'Acquista'}
    </button>
  );
}

const PLANS = [
  { name: 'STARTER', price: 29, setup: 299, credits: 200, features: ['1 website', '200 AI credits/mo', 'Email support'] },
  { name: 'GROWTH', price: 49, setup: 599, credits: 500, features: ['3 websites', '500 AI credits/mo', 'Priority support', 'Custom domain'] },
  { name: 'PRO', price: 99, setup: 999, credits: 1000, features: ['10 websites', '1000 AI credits/mo', 'Dedicated support', 'Custom domain', 'API access'] },
];

export default function BillingPage() {
  const navigate = useNavigate();
  const user = useStore(authUser);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [billingRes, invoicesRes] = await Promise.all([
        apiClient<BillingData>('/portal/billing'),
        apiClient<{ invoices: Invoice[] }>('/portal/billing/invoices'),
      ]);

      if (billingRes.success && billingRes.data) setBilling(billingRes.data);
      if (invoicesRes.success && invoicesRes.data) setInvoices(invoicesRes.data.invoices || []);

      setLoading(false);
    }

    load();
  }, []);

  const openStripePortal = async () => {
    const res = await apiClient<{ url: string }>('/portal/billing/portal', { method: 'POST' });
    if (res.success && res.data?.url) {
      window.open(res.data.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1">
      {/* Header */}
      <div className="border-b border-bolt-elements-borderColor px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary">
            <div className="i-ph:arrow-left text-xl" />
          </button>
          <h1 className="text-xl font-semibold text-bolt-elements-textPrimary">Billing</h1>
        </div>
        <a href="/" className="text-sm text-indigo-400 hover:text-indigo-300">Back to Editor</a>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Current Plan */}
        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-indigo-400">{user?.plan || billing?.plan || 'STARTER'}</span>
              <span className="text-bolt-elements-textTertiary ml-2">
                {billing?.nextChargeDate && `Next billing: ${new Date(billing.nextChargeDate).toLocaleDateString()}`}
              </span>
            </div>
            <button
              onClick={openStripePortal}
              className="px-4 py-2 rounded-lg bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor text-sm"
            >
              Manage Subscription
            </button>
          </div>
        </div>

        {/* Credits */}
        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">AI Credits</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-bolt-elements-textSecondary">
                  {billing?.creditsUsed || 0} / {billing?.creditsTotal || 200} used
                </span>
                <span className="text-indigo-400 font-medium">
                  {billing?.creditsRemaining || 0} remaining
                </span>
              </div>
              <div className="w-full bg-bolt-elements-background-depth-3 rounded-full h-3">
                <div
                  className="bg-indigo-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((billing?.creditsUsed || 0) / (billing?.creditsTotal || 200)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Extra Credits */}
        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Crediti Aggiuntivi</h2>
              <p className="text-sm text-bolt-elements-textTertiary mt-1">Acquista crediti extra quando finiscono quelli del piano. Non scadono.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { credits: 100, price: 14, label: 'Starter Pack' },
              { credits: 300, price: 38, label: 'Popular', highlight: true },
              { credits: 1000, price: 120, label: 'Pro Pack' },
            ].map((pack) => (
              <div
                key={pack.credits}
                className={`rounded-xl p-4 border text-center ${pack.highlight ? 'border-indigo-500 bg-indigo-500/5' : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-3'}`}
              >
                {pack.highlight && <div className="text-xs text-indigo-400 font-bold mb-2 uppercase tracking-wide">Più popolare</div>}
                <div className="text-2xl font-bold text-bolt-elements-textPrimary">{pack.credits}</div>
                <div className="text-xs text-bolt-elements-textTertiary mb-3">crediti AI</div>
                <div className="text-lg font-semibold text-indigo-400 mb-3">€{pack.price}</div>
                <BuyCreditsButton credits={pack.credits} price={pack.price} />
              </div>
            ))}
          </div>
          <p className="text-xs text-bolt-elements-textTertiary mt-4 text-center">
            1 credito = 1 generazione AI (modifiche, ricostruzioni, creazioni). I crediti del piano si resettano ogni mese. Quelli acquistati non scadono mai.
          </p>
        </div>

        {/* Plans */}
        <div>
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border ${
                  user?.plan === plan.name
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2'
                }`}
              >
                <h3 className="font-semibold text-bolt-elements-textPrimary">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-bolt-elements-textPrimary">{plan.price}</span>
                  <span className="text-bolt-elements-textTertiary">/mo</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                      <div className="i-ph:check text-green-400 text-sm" />
                      {f}
                    </li>
                  ))}
                </ul>
                {user?.plan === plan.name ? (
                  <div className="mt-4 text-center text-sm text-indigo-400 font-medium">Current Plan</div>
                ) : (
                  <button
                    onClick={openStripePortal}
                    className="mt-4 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                  >
                    {PLANS.indexOf(plan) > PLANS.findIndex((p) => p.name === user?.plan) ? 'Upgrade' : 'Change'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
            <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Invoices</h2>
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-bolt-elements-borderColor last:border-0">
                  <div>
                    <span className="text-sm text-bolt-elements-textPrimary">
                      {new Date(inv.date).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-bolt-elements-textTertiary ml-3">
                      {(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${inv.status === 'PAID' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {inv.status}
                    </span>
                    {inv.invoiceUrl && (
                      <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
