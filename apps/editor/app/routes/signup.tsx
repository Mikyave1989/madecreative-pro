import { useState } from 'react';
import { useNavigate, Link } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/cloudflare';
import { API_URL } from '~/lib/api/client';

export const meta: MetaFunction = () => [
  { title: 'Sign Up — MadeCreative' },
  { name: 'description', content: 'Create your MadeCreative account and start building.' },
];

interface Plan {
  id: 'STARTER' | 'GROWTH' | 'PRO';
  label: string;
  price: string;
  period: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'STARTER',
    label: 'Starter',
    price: '€299',
    period: ' setup + €29/mo',
    features: ['5 active projects', '50 AI generations/mo', 'Basic support'],
  },
  {
    id: 'GROWTH',
    label: 'Growth',
    price: '€599',
    period: ' setup + €49/mo',
    features: ['20 active projects', '200 AI generations/mo', 'Priority support'],
  },
  {
    id: 'PRO',
    label: 'Pro',
    price: '€999',
    period: ' setup + €99/mo',
    features: ['Unlimited projects', 'Unlimited AI generations', 'Dedicated support'],
  },
];

export default function SignupPage() {
  const navigate = useNavigate();

  // Pre-fill from URL params (e.g. from preview CTA: ?plan=PRO&email=...&company=...)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlPlan = urlParams.get('plan')?.toUpperCase() as Plan['id'] | null;
  const urlEmail = urlParams.get('email') || '';
  const urlCompany = urlParams.get('company') || '';
  const urlProspectId = urlParams.get('prospectId') || '';
  const validPlan = (urlPlan && PLANS.find(p => p.id === urlPlan)) ? urlPlan : 'GROWTH';

  const [email, setEmail] = useState(urlEmail);
  const [companyName, setCompanyName] = useState(urlCompany);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [plan, setPlan] = useState<Plan['id']>(validPlan);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: Record<string, string> = {
        plan,
        billing: 'monthly',
        email: email.trim(),
        companyName: companyName.trim(),
      };

      if (websiteUrl.trim()) body.websiteUrl = websiteUrl.trim();
      if (urlProspectId) body.prospectId = urlProspectId;

      const res = await fetch(`${API_URL}/public/signup/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Brand header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            MadeCreative
          </h1>
          <p className="text-bolt-elements-textSecondary mt-2 text-sm">
            Create your account — no credit card required until checkout
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-bolt-elements-background-depth-2 rounded-xl p-8 shadow-lg border border-bolt-elements-borderColor space-y-5"
        >

          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
              Email address <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              placeholder="you@company.com"
            />
          </div>

          {/* Company name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
              Company name <span className="text-red-400">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              placeholder="Acme Inc."
            />
          </div>

          {/* Website URL (optional) */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
              Website URL
              <span className="ml-1.5 text-xs text-bolt-elements-textTertiary font-normal">(optional)</span>
            </label>
            <input
              id="websiteUrl"
              type="url"
              autoComplete="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              placeholder="https://yourcompany.com"
            />
          </div>

          {/* Plan selection */}
          <div>
            <span className="block text-sm font-medium text-bolt-elements-textPrimary mb-2.5">
              Choose a plan <span className="text-red-400">*</span>
            </span>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map((p) => {
                const selected = plan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={[
                      'relative flex flex-col items-center rounded-lg border p-3 text-center transition-all cursor-pointer',
                      selected
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500'
                        : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-3 hover:border-indigo-400',
                    ].join(' ')}
                  >
                    {p.id === 'GROWTH' && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Popular
                      </span>
                    )}
                    <span
                      className={[
                        'text-sm font-semibold',
                        selected ? 'text-indigo-400' : 'text-bolt-elements-textPrimary',
                      ].join(' ')}
                    >
                      {p.label}
                    </span>
                    <span className="text-lg font-bold text-bolt-elements-textPrimary mt-1">
                      {p.price}
                      <span className="text-xs font-normal text-bolt-elements-textTertiary">{p.period}</span>
                    </span>
                    <ul className="mt-2 space-y-0.5 text-left w-full">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1 text-[11px] text-bolt-elements-textSecondary">
                          <span className="mt-px text-indigo-400 shrink-0">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Preparing checkout…
              </>
            ) : (
              'Continue to Checkout'
            )}
          </button>

          {/* Secure note */}
          <p className="text-center text-xs text-bolt-elements-textTertiary flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secured by Stripe — your card details never touch our servers
          </p>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-bolt-elements-textTertiary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
