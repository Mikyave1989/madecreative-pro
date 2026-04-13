import { useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { API_URL } from '~/lib/api/client';

// ─── How It Works ──────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: 'i-ph:chat-circle-text',
    title: 'Describe your vision',
    desc: 'Tell the AI what you need. "A modern restaurant website with an online menu, reservation form, and photo gallery." That\'s it.',
  },
  {
    num: '02',
    icon: 'i-ph:code',
    title: 'AI writes real code',
    desc: 'Our AI generates production-grade React, Next.js, and Tailwind CSS code in real-time. Watch your website come to life in seconds.',
  },
  {
    num: '03',
    icon: 'i-ph:rocket-launch',
    title: 'Deploy in one click',
    desc: 'Hit deploy and your site is live with SSL, CDN, and a custom domain. Edit anytime by chatting with the AI.',
  },
];

// ─── Features ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'i-ph:magic-wand',
    title: 'AI Website Builder',
    desc: 'Describe your vision in plain language. Our AI creates a complete, premium website with animations, interactions, and responsive design.',
    color: '#6366f1',
  },
  {
    icon: 'i-ph:globe-simple',
    title: 'Scrape & Rebuild',
    desc: 'Already have a site? We analyze it, extract your photos, text, and branding, then rebuild it at 10x quality with modern technology.',
    color: '#8b5cf6',
  },
  {
    icon: 'i-ph:file-code',
    title: 'Real Code, Not Templates',
    desc: 'Every site is built with React, Next.js, Tailwind CSS, and Framer Motion. You own the source code. No lock-in, no drag-and-drop limitations.',
    color: '#a855f7',
  },
  {
    icon: 'i-ph:rocket-launch',
    title: 'One-Click Deploy',
    desc: 'Deploy your site instantly to a global CDN. Custom domains with SSL certificates included. Your site loads fast everywhere.',
    color: '#ec4899',
  },
  {
    icon: 'i-ph:chat-circle-dots',
    title: 'Chat to Edit',
    desc: '"Make the header blue", "Add a testimonials section", "Change the hero image". Just chat and the AI makes changes in seconds.',
    color: '#f43f5e',
  },
  {
    icon: 'i-ph:devices',
    title: 'Fully Responsive',
    desc: 'Every site looks perfect on mobile, tablet, and desktop. We test across all screen sizes automatically — pixel-perfect on every device.',
    color: '#f97316',
  },
  {
    icon: 'i-ph:robot',
    title: 'AI Chatbot Included',
    desc: 'Every site gets a smart chatbot widget that knows your business. It answers customer questions 24/7, generates leads, and books appointments.',
    color: '#14b8a6',
  },
  {
    icon: 'i-ph:chart-line-up',
    title: 'Monthly Reports',
    desc: 'Receive automated monthly PDF reports with visitor stats, chatbot performance, lead generation data, and actionable recommendations.',
    color: '#3b82f6',
  },
  {
    icon: 'i-ph:shield-check',
    title: 'Monitoring & Uptime',
    desc: 'We monitor your site 24/7. If it goes down, we get alerted instantly and fix it before you even notice. 99.9% uptime guaranteed.',
    color: '#22c55e',
  },
];

// ─── Comparison ────────────────────────────────────────────────────────────

const COMPARISON = [
  { feature: 'Time to launch', traditional: '2-8 weeks', madecreative: 'Under 5 minutes' },
  { feature: 'Cost', traditional: '2,000 - 15,000+', madecreative: 'From 25/month' },
  { feature: 'Code ownership', traditional: 'Often locked', madecreative: 'Full source code' },
  { feature: 'Edits & changes', traditional: 'Wait for dev', madecreative: 'Chat with AI, instant' },
  { feature: 'Technology', traditional: 'WordPress / Wix', madecreative: 'React + Next.js' },
  { feature: 'Mobile optimization', traditional: 'Sometimes', madecreative: 'Always, auto-tested' },
  { feature: 'Chatbot', traditional: 'Extra cost', madecreative: 'Included' },
  { feature: 'Monthly reports', traditional: 'Not included', madecreative: 'Automated PDF' },
];

// ─── Pricing ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Starter',
    slug: 'STARTER',
    price: 25,
    period: '/mo',
    desc: 'Perfect for small businesses getting started online.',
    features: [
      '1 website',
      '200 AI credits / month',
      'Custom subdomain (you.madecreative.pro)',
      'SSL certificate',
      'One-click deploy',
      'AI chatbot widget',
      'Monthly PDF report',
      'Email support',
    ],
    notIncluded: ['Custom domain', 'Analytics dashboard', 'Priority support'],
    popular: false,
  },
  {
    name: 'Growth',
    slug: 'GROWTH',
    price: 50,
    period: '/mo',
    desc: 'For growing businesses that need more power and custom branding.',
    features: [
      '3 websites',
      '500 AI credits / month',
      'Custom domain (yourbrand.com)',
      'SSL certificate',
      'One-click deploy',
      'AI chatbot widget',
      'Monthly PDF report',
      'Analytics dashboard',
      'Priority support',
      'Uptime monitoring',
    ],
    notIncluded: [],
    popular: true,
  },
  {
    name: 'Pro',
    slug: 'PRO',
    price: 99,
    period: '/mo',
    desc: 'For agencies and power users. Build unlimited, brand as yours.',
    features: [
      '10 websites',
      '1,000 AI credits / month',
      'Custom domain',
      'SSL certificate',
      'One-click deploy',
      'AI chatbot widget',
      'Monthly PDF report',
      'Analytics dashboard',
      'Dedicated support',
      'Uptime monitoring',
      'API access',
      'White-label branding',
      'Multi-language sites',
    ],
    notIncluded: [],
    popular: false,
  },
];

// ─── Testimonials ──────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Marco R.',
    role: 'Restaurant Owner, Munich',
    text: 'I described my restaurant and in 2 minutes I had a website better than what my agency built in 3 weeks. The chatbot already booked 12 reservations this month.',
    rating: 5,
    avatar: 'M',
  },
  {
    name: 'Sarah K.',
    role: 'Freelance Designer, Berlin',
    text: 'I prototype client sites in minutes now. The AI writes real React code — I just export it and customize. My workflow is 10x faster.',
    rating: 5,
    avatar: 'S',
  },
  {
    name: 'Thomas M.',
    role: 'Startup Founder, Hamburg',
    text: 'We launched 3 landing pages in one afternoon for A/B testing. Real Next.js code, not some drag-and-drop toy. The monthly reports are a nice bonus too.',
    rating: 5,
    avatar: 'T',
  },
  {
    name: 'Anna L.',
    role: 'Bakery Owner, Vienna',
    text: 'I was paying 200/month for a WordPress site I couldn\'t even update myself. Now I pay 25 and change anything by chatting. Mind blown.',
    rating: 5,
    avatar: 'A',
  },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'What exactly does the AI build?',
    a: 'Real, production-grade code using React, Next.js, and Tailwind CSS. Not templates — every site is unique and generated from scratch based on your description. You get full source code ownership.',
  },
  {
    q: 'Can I edit the site after it\'s built?',
    a: 'Absolutely. Just chat with the AI: "Change the hero text", "Add a gallery section", "Make the buttons green". Changes happen in seconds. You can also edit the code directly in the built-in editor.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'Not at all. The entire process is conversational. Describe what you want in plain language and the AI handles all the coding. If you do know code, you can edit it directly.',
  },
  {
    q: 'What are AI credits?',
    a: 'Each interaction with the AI (generating a site, making edits, chatting) uses credits. A full site build uses about 5 credits. Small edits use 0.5-1 credit. Credits reset monthly.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Yes! Growth and Pro plans include custom domain support. Just point your DNS to our servers and we handle SSL certificates automatically.',
  },
  {
    q: 'What about SEO?',
    a: 'Every site includes proper meta tags, Open Graph data, Schema.org structured data, responsive design, fast loading times, and semantic HTML — all the foundations for great SEO.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fees. Cancel anytime from your billing dashboard. Your sites stay live until the end of your billing period.',
  },
  {
    q: 'What\'s included in the chatbot?',
    a: 'An AI-powered widget that you embed on your site. It learns about your business from a knowledge base you configure, answers customer questions 24/7, and generates leads. Included in all plans.',
  },
];

// ─── Stats ─────────────────────────────────────────────────────────────────

const STATS = [
  { value: '500+', label: 'Websites built' },
  { value: '<60s', label: 'Avg. build time' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '24/7', label: 'AI + Monitoring' },
];

// ─── Component ─────────────────────────────────────────────────────────────

export function Landing() {
  const navigate = useNavigate();
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);

  async function handleCheckout(planSlug: string) {
    if (!checkoutEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail)) {
      setCheckoutError('Please enter a valid email address.');
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await fetch(`${API_URL}/public/signup/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planSlug,
          billing: annual ? 'annual' : 'monthly',
          email: checkoutEmail.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setCheckoutError(data.error || 'Something went wrong. Try again.');
        setCheckoutLoading(false);
      }
    } catch {
      setCheckoutError('Connection error. Please try again.');
      setCheckoutLoading(false);
    }
  }

  const GradientText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span
      className={className}
      style={{
        background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </span>
  );

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary">

      {/* ─── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-bolt-elements-background-depth-1/80 border-b border-bolt-elements-borderColor">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MadeCreative
          </span>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#how-it-works" className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hidden md:block">How it works</a>
            <a href="#features" className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hidden md:block">Features</a>
            <a href="#pricing" className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hidden sm:block">Pricing</a>
            <button onClick={() => navigate('/login')} className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary">Sign In</button>
            <button onClick={() => navigate('/signup')} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-36 pb-20 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-8 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI-Powered Website Builder
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
            Your complete website
            <br />
            <GradientText>built by AI in minutes</GradientText>
          </h1>

          <p className="text-base sm:text-lg text-bolt-elements-textSecondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe what you want. Our AI writes real React code, deploys it live, and gives you
            a chatbot, analytics, and monthly reports — all for the price of a pizza.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-semibold transition-all text-lg text-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              See Plans & Pricing
            </a>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 font-semibold transition-colors text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="py-10 px-6 border-y border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div className="text-sm text-bolt-elements-textTertiary mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-medium text-indigo-400 mb-2">Simple process</div>
            <h2 className="text-3xl sm:text-4xl font-bold">Three steps to your website</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%_-_16px)] w-[calc(100%_-_48px)] h-[2px] bg-gradient-to-r from-indigo-500/40 to-transparent" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}
                  >
                    <div className={`${step.icon} text-3xl text-indigo-400`} />
                  </div>
                  <div className="text-xs text-indigo-400 font-mono font-bold mb-2">STEP {step.num}</div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-bolt-elements-textSecondary leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-bolt-elements-background-depth-2/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-medium text-indigo-400 mb-2">Everything included</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Not just a website builder</h2>
            <p className="text-bolt-elements-textSecondary max-w-2xl mx-auto">
              MadeCreative is a complete digital presence platform. AI website builder + chatbot + analytics + monitoring + monthly reports. All automated.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-xl bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${f.color}15` }}
                >
                  <div className={`${f.icon} text-xl`} style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-bolt-elements-textSecondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-medium text-indigo-400 mb-2">Why switch</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Traditional agency vs MadeCreative</h2>
          </div>
          <div className="rounded-xl border border-bolt-elements-borderColor overflow-hidden">
            <div className="grid grid-cols-3 bg-bolt-elements-background-depth-2 text-sm font-medium">
              <div className="p-4" />
              <div className="p-4 text-center text-bolt-elements-textTertiary">Traditional</div>
              <div className="p-4 text-center text-indigo-400">MadeCreative</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-bolt-elements-background-depth-1' : 'bg-bolt-elements-background-depth-2/50'}`}
              >
                <div className="p-4 font-medium">{row.feature}</div>
                <div className="p-4 text-center text-bolt-elements-textTertiary">{row.traditional}</div>
                <div className="p-4 text-center text-green-400 font-medium">{row.madecreative}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-bolt-elements-background-depth-2/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-medium text-indigo-400 mb-2">Social proof</div>
            <h2 className="text-3xl sm:text-4xl font-bold">Loved by business owners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-5 rounded-xl bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }, (_, i) => (
                    <span key={i} className="text-amber-400 text-sm">&#9733;</span>
                  ))}
                </div>
                <p className="text-sm text-bolt-elements-textSecondary mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-bolt-elements-textTertiary">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-sm font-medium text-indigo-400 mb-2">Pricing</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-bolt-elements-textSecondary max-w-xl mx-auto">
              All plans include AI website builder, chatbot, deploy, monitoring, and monthly reports. No hidden fees. Cancel anytime.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm ${!annual ? 'text-bolt-elements-textPrimary font-medium' : 'text-bolt-elements-textTertiary'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-indigo-600' : 'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-bolt-elements-textPrimary font-medium' : 'text-bolt-elements-textTertiary'}`}>Annual</span>
            {annual && <span className="text-xs text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded-full">Save 20%</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const displayPrice = annual ? Math.round(plan.price * 0.8) : plan.price;
              const isActive = checkoutPlan === plan.slug;

              return (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-6 border transition-all ${
                    plan.popular
                      ? 'border-indigo-500 bg-indigo-500/5 shadow-xl shadow-indigo-500/10 md:scale-105 relative'
                      : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-bolt-elements-textTertiary mt-1 mb-4">{plan.desc}</p>

                  <div className="mb-6">
                    <span className="text-bolt-elements-textTertiary text-lg align-top">&#8364;</span>
                    <span className="text-5xl font-bold">{displayPrice}</span>
                    <span className="text-bolt-elements-textTertiary">{plan.period}</span>
                    {annual && (
                      <div className="text-xs text-bolt-elements-textTertiary mt-1">
                        <span className="line-through">&#8364;{plan.price * 12}</span>{' '}
                        <span className="text-green-400">&#8364;{displayPrice * 12}/year</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <div className="i-ph:check-circle-fill text-green-400 text-base shrink-0 mt-0.5" />
                        <span className="text-bolt-elements-textSecondary">{f}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                        <div className="i-ph:x-circle text-base shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Checkout inline */}
                  {isActive ? (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={checkoutEmail}
                        onChange={(e) => { setCheckoutEmail(e.target.value); setCheckoutError(''); }}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2.5 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCheckout(plan.slug); }}
                      />
                      {checkoutError && <p className="text-xs text-red-400">{checkoutError}</p>}
                      <button
                        onClick={() => handleCheckout(plan.slug)}
                        disabled={checkoutLoading}
                        className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                      >
                        {checkoutLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Redirecting to Stripe...
                          </>
                        ) : (
                          <>
                            <div className="i-ph:lock-simple text-sm" />
                            Pay &#8364;{displayPrice}/mo — Checkout
                          </>
                        )}
                      </button>
                      <button onClick={() => { setCheckoutPlan(null); setCheckoutError(''); }} className="w-full text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setCheckoutPlan(plan.slug); setCheckoutError(''); }}
                      className={`w-full py-2.5 rounded-lg text-center text-sm font-medium transition-all ${
                        plan.popular
                          ? 'text-white'
                          : 'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary border border-bolt-elements-borderColor'
                      }`}
                      style={plan.popular ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : undefined}
                    >
                      Get Started
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-bolt-elements-textTertiary mt-8 flex items-center justify-center gap-1.5">
            <div className="i-ph:lock-simple text-sm" />
            Secured by Stripe. Cancel anytime. 14-day money-back guarantee.
          </p>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-bolt-elements-background-depth-2/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm font-medium text-indigo-400 mb-2">FAQ</div>
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  <div className={`i-ph:caret-down text-lg text-bolt-elements-textTertiary transition-transform shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-bolt-elements-textSecondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Stop paying agencies.<br />
            <GradientText>Start building with AI.</GradientText>
          </h2>
          <p className="text-bolt-elements-textSecondary mb-8 max-w-xl mx-auto">
            Join hundreds of businesses that switched from expensive agencies and slow WordPress sites to AI-powered websites that build themselves.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-semibold text-lg text-center transition-all hover:shadow-lg hover:shadow-indigo-500/20"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Get Started from &#8364;25/mo
            </a>
          </div>
          <p className="mt-4 text-xs text-bolt-elements-textTertiary">14-day money-back guarantee. No contracts.</p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-bolt-elements-borderColor">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <span className="text-lg font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MadeCreative
              </span>
              <p className="text-xs text-bolt-elements-textTertiary mt-2 leading-relaxed">
                AI-powered website builder. Real code, real results.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">Features</a>
                <a href="#pricing" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">Pricing</a>
                <a href="#how-it-works" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">How it works</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Support</h4>
              <div className="space-y-2">
                <a href="#faq" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">FAQ</a>
                <a href="mailto:support@madecreative.pro" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">Privacy Policy</a>
                <a href="#" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">Terms of Service</a>
                <a href="#" className="block text-sm text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary">Imprint</a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-bolt-elements-borderColor flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-bolt-elements-textTertiary">
            <span>
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 600 }}>MadeCreative</span>
              {' '}&copy; {new Date().getFullYear()}. All rights reserved.
            </span>
            <span>Made with AI in Munich, Germany</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
