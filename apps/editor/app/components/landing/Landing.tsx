// useNavigate removed — no more login/signup
import { useState, useEffect } from 'react';
import { API_URL } from '~/lib/api/client';

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const PORTFOLIO = [
  { name: 'LENTRODT die zahnaerzte', city: 'Munich', sector: 'Dental', url: 'https://madecreative-cloner-f6hwmv0xa-mikyave1989s-projects.vercel.app', original: 'https://zahnarztlentrodt.de/', screenshot: 'https://image.thum.io/get/width/800/crop/600/https://madecreative-cloner-f6hwmv0xa-mikyave1989s-projects.vercel.app' },
  { name: 'Hamburg Smile', city: 'Hamburg', sector: 'Dental', url: 'https://mc-preview-hamburg-smile-zahnarzt-hamburg-innenstadt-prwhmany9.vercel.app', original: 'http://www.hamburg-smile.de/', screenshot: 'https://image.thum.io/get/width/800/crop/600/https://mc-preview-hamburg-smile-zahnarzt-hamburg-innenstadt-prwhmany9.vercel.app' },
];

const AGENTS = [
  { id: 'scraper', name: 'SCRAPER', emoji: '\uD83D\uDD0D', role: 'Data Collector', verb: 'Scanning 3 pages...', color: '#3b82f6', x: 5, desc: 'Scans your existing website. Downloads every page, photo, video, and text. Nothing is missed.' },
  { id: 'analyzer', name: 'ANALYZER', emoji: '\uD83E\uDDE0', role: 'Business Intel', verb: 'Lead score: 87/100', color: '#8b5cf6', x: 25, desc: 'Evaluates your online presence. Google rating, social profiles, competitors, SEO gaps.' },
  { id: 'builder', name: 'BUILDER', emoji: '\u26A1', role: 'Design Builder', verb: 'Writing 12 files...', color: '#6366f1', x: 45, desc: 'Rebuilds your entire site with premium design. Same content, 10x better looking. Multi-page, animated, responsive.' },
  { id: 'outreach', name: 'OUTREACH', emoji: '\uD83D\uDCE7', role: 'Delivery Engine', verb: 'Preview ready!', color: '#ec4899', x: 65, desc: 'Delivers your new site preview directly to your inbox. One click to see the result.' },
  { id: 'qa', name: 'QA', emoji: '\uD83D\uDEE1\uFE0F', role: 'Quality Guard', verb: 'Score: 98/100', color: '#22c55e', x: 85, desc: 'Tests everything. Mobile, tablet, desktop. Speed, links, SEO. Ensures perfection.' },
];

const FEATURES = [
  { icon: 'i-ph:paint-brush', t: 'Premium Redesign', d: 'We take your existing site and rebuild it with a stunning modern design. Same content, new look.' },
  { icon: 'i-ph:images', t: 'Your Real Content', d: 'Your photos, your text, your videos. We don\'t use stock images or placeholder text. It\'s YOUR site, upgraded.' },
  { icon: 'i-ph:stack', t: 'Every Page Rebuilt', d: 'Homepage, about, services, contact, team — every page of your site gets the premium treatment.' },
  { icon: 'i-ph:devices', t: 'Fully Responsive', d: 'Looks perfect on every device. Mobile, tablet, laptop, desktop — tested on all screens.' },
  { icon: 'i-ph:magnifying-glass', t: 'SEO Built-In', d: 'Optimized for Google from day one. Meta tags, structured data, fast loading, clean code.' },
  { icon: 'i-ph:cloud-arrow-up', t: 'Hosting Included', d: 'Professional hosting, SSL certificate, custom domain — all included. No extra costs.' },
];

const COMPARISON = [
  { f: 'Traditional web agency', old: '$2,000 - $15,000', us: '\u20AC9.99 one-time \u2014 everything included' },
  { f: 'Freelance developer', old: '$800 - $3,000', us: '\u20AC9.99 one-time \u2014 everything included' },
  { f: 'Wix / Squarespace', old: 'Same templates for everyone', us: 'Unique design from YOUR content' },
  { f: 'Time to launch', old: '2\u20138 weeks', us: 'Ready in 24 hours' },
  { f: 'Technology', old: 'WordPress / outdated CMS', us: 'Next.js + React \u2014 cutting edge' },
  { f: 'Edits', old: 'Wait for your developer', us: '2 included monthly' },
];

const PLANS = [
  {
    name: 'Starter',
    slug: 'STARTER',
    price: 9.99,
    period: 'one-time',
    desc: 'Pagamento unico di \u20AC9.99 \u2014 nessun abbonamento.',
    features: [
      'Sito premium ricostruito con AI',
      'Hosting, SSL e dominio inclusi per il primo anno',
      'SEO ottimizzato \u2014 visibile su Google dal primo giorno',
      'Fully responsive \u2014 mobile, tablet, desktop',
      '2 modifiche incluse',
      'Supporto email entro 24 ore',
    ],
    hl: false,
  },
  {
    name: 'Pro',
    slug: 'PRO',
    price: 49,
    period: '/month',
    desc: '30 giorni gratis, poi \u20AC49/mese \u2014 sito sempre aggiornato.',
    features: [
      'Tutto ci\u00f2 che include Starter',
      '30 giorni di prova gratuita \u2014 nessun addebito prima del 31\u00b0 giorno',
      'Hosting, SSL e dominio inclusi per sempre',
      'Modifiche illimitate al sito',
      'Monitoraggio SEO mensile',
      'Supporto prioritario (risposta entro 4 ore)',
      'Disdici in qualunque momento durante la prova',
    ],
    hl: true,
  },
];

const TESTIMONIALS = [
  { name: 'Dr. Stefan M.', role: 'Dentist, Munich', text: 'I couldn\'t believe it was the same website. All my content, but the design looks like I paid \u20AC10,000 for it.', a: 'S' },
  { name: 'Laura K.', role: 'Restaurant Owner, Berlin', text: 'Our old site was embarrassing. Now customers compliment it every week. And I didn\'t have to change a single word.', a: 'L' },
  { name: 'Thomas B.', role: 'Law Firm, Hamburg', text: 'Professional, modern, fast. Exactly what our firm needed. The old site took 3 months to build. This was ready overnight.', a: 'T' },
  { name: 'Anna W.', role: 'Boutique Hotel, Vienna', text: 'Same photos, same rooms, same text \u2014 but the site now looks like a 5-star brand. Worth every cent.', a: 'A' },
];

const FAQS = [
  { q: 'What exactly do you do?', a: 'We take your existing website and rebuild it with a premium modern design. Your content stays exactly the same \u2014 we only upgrade the look and feel.' },
  { q: 'Do I need to provide anything?', a: 'Just your website URL. We handle everything \u2014 downloading your content, photos, videos, and rebuilding it all with premium design.' },
  { q: 'Will my content change?', a: 'No. Every word, every photo, every video stays exactly the same. We only change the visual design, animations, and layout.' },
  { q: 'How long does it take?', a: 'Your new site preview is usually ready within 24 hours. You can review it before going live.' },
  { q: 'What technology do you use?', a: 'Next.js, React, Tailwind CSS, Framer Motion. Modern, fast, SEO-friendly. The same stack used by top companies worldwide.' },
  { q: 'Which plan should I choose?', a: 'Starter is a one-time \u20AC9.99 payment \u2014 one year of hosting, SSL, and domain included, then you keep your site. Pro is \u20AC49/month after a 30-day free trial \u2014 unlimited edits, priority support, and hosting forever.' },
  { q: 'Is there a free trial?', a: 'Yes \u2014 the Pro plan includes 30 days free. You won\u2019t be charged until day 31, and you can cancel anytime during the trial.' },
  { q: 'Is hosting included?', a: 'Yes. Professional hosting, SSL certificate, and custom domain are included in both plans.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function Landing() {
  // navigate removed — no more login/signup
  const [cPlan, setCPlan] = useState<string | null>(null);
  const [cEmail, setCEmail] = useState('');
  const [cLoad, setCLoad] = useState(false);
  const [cErr, setCErr] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeA, setActiveA] = useState(0);

  useEffect(() => { const t = setInterval(() => setActiveA(i => (i + 1) % AGENTS.length), 3500); return () => clearInterval(t); }, []);

  async function checkout(slug: string) {
    if (!cEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail)) { setCErr('Enter a valid email.'); return; }
    setCLoad(true); setCErr('');
    try {
      const billing = slug === 'PRO' ? 'monthly' : 'onetime';
      const r = await fetch(`${API_URL}/public/signup/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: slug, billing, email: cEmail.trim() }) });
      const d = await r.json();
      if (d.success && d.data?.clientSecret) window.location.href = `/pay?cs=${encodeURIComponent(d.data.clientSecret)}`;
      else { setCErr(d.error || 'Error.'); setCLoad(false); }
    } catch { setCErr('Connection error.'); setCLoad(false); }
  }

  // ── inline style helpers to override bolt-elements theme ──
  const S = {
    bg: { backgroundColor: '#050507' } as React.CSSProperties,
    bg2: { backgroundColor: '#0a0a0f' } as React.CSSProperties,
    bg3: { backgroundColor: '#0f0f17' } as React.CSSProperties,
    card: { backgroundColor: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 } as React.CSSProperties,
    cardHl: { backgroundColor: '#0d0d14', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16 } as React.CSSProperties,
    faq: { backgroundColor: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 } as React.CSSProperties,
    t1: { color: '#ffffff' } as React.CSSProperties,
    t2: { color: '#a1a1aa' } as React.CSSProperties,
    t3: { color: '#71717a' } as React.CSSProperties,
    t4: { color: '#52525b' } as React.CSSProperties,
    gt: { background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as React.CSSProperties,
    gb: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } as React.CSSProperties,
  };

  return (
    <div style={{ ...S.bg, color: '#ffffff', minHeight: '100vh' }}>
      <style>{`
        @keyframes mc-work{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes mc-pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes mc-scan{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes mc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes mc-orbit{0%{transform:rotate(0deg) translateX(40px) rotate(0deg)}100%{transform:rotate(360deg) translateX(40px) rotate(-360deg)}}
        @keyframes mc-data-up{0%{transform:translateY(0);opacity:.8}100%{transform:translateY(-30px);opacity:0}}
        @keyframes mc-typing{0%,100%{width:0}50%{width:60px}}
        @keyframes mc-dash{0%{stroke-dashoffset:200}100%{stroke-dashoffset:0}}
        .mc-link:hover{color:#e4e4e7!important}
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, backgroundColor: 'rgba(5,5,7,.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, ...S.gt }}>MadeCreative</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="#agents" className="mc-link" style={{ fontSize: 14, ...S.t3, textDecoration: 'none' }}>Agents</a>
            <a href="#pricing" className="mc-link" style={{ fontSize: 14, ...S.t3, textDecoration: 'none' }}>Pricing</a>
            <a href="https://wa.me/393317389918?text=Ciao%2C%20vorrei%20sapere%20di%20pi%C3%B9%20su%20MadeCreative!" target="_blank" rel="noopener" style={{ ...S.gb, padding: '8px 16px', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Contact Us</a>
          </div>
        </div>
      </nav>

      {/* ── HERO + VIDEO ─────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 120, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, borderRadius: '50%', filter: 'blur(180px)', background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '64px 24px 32px', position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, border: '1px solid rgba(255,255,255,.1)', backgroundColor: 'rgba(255,255,255,.03)', fontSize: 12, marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80', animation: 'mc-pulse 2s ease-in-out infinite' }} />
            <span style={S.t3}>Premium Website Redesign Service</span>
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em', color: '#fff' }}>
            Your website. Same content.<br />
            <span style={S.gt}>10x better design.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6, ...S.t2 }}>
            We take your existing site and rebuild it with premium quality. Same photos, same text &mdash; just stunning modern design.
            <span style={S.t1}> Da &euro;9.99 una tantum. Pro &euro;49/mese con 30 giorni gratis.</span>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            <a href="#pricing" style={{ ...S.gb, padding: '14px 32px', borderRadius: 12, color: '#fff', fontWeight: 600, fontSize: 18, textDecoration: 'none' }}>Get Your Free Preview</a>
            <a href="#agents" style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', color: '#d4d4d8', fontWeight: 600, fontSize: 18, textDecoration: 'none' }}>See It in Action</a>
          </div>
        </div>

        {/* Video */}
        <div style={{ maxWidth: 960, margin: '48px auto 0', padding: '0 24px' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 0 80px rgba(99,102,241,.1)' }}>
            <div style={{ height: 36, background: 'linear-gradient(180deg, rgba(20,20,30,1) 0%, rgba(15,15,23,1) 100%)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} /><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e' }} /><div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840' }} /></div>
              <span style={{ fontSize: 11, ...S.t4, fontFamily: 'monospace', marginLeft: 8 }}>madecreative.pro</span>
            </div>
            <video autoPlay loop muted playsInline style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}>
              <source src="/hero-demo.webm" type="video/webm" />
            </video>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
          {[{ v: '500+', l: 'Sites redesigned' }, { v: '24h', l: 'Turnaround time' }, { v: '99.9%', l: 'Uptime SLA' }, { v: '5', l: 'AI Agents' }].map(s => (
            <div key={s.l}><div style={{ fontSize: 36, fontWeight: 700, ...S.gt }}>{s.v}</div><div style={{ fontSize: 14, ...S.t4, marginTop: 4 }}>{s.l}</div></div>
          ))}
        </div>
      </section>

      {/* ══ AGENT ECOSYSTEM — animated workspace ═════════════════════════ */}
      <section id="agents" style={{ padding: '96px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(99,102,241,.04), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1152, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#818cf8', marginBottom: 12 }}>// THE AGENT TEAM</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Watch your agents work</h2>
            <p style={{ ...S.t2, maxWidth: 560, margin: '0 auto' }}>Five specialized agents handle every step of your redesign. Click one to see what they do.</p>
          </div>

          {/* ── Agent Workspace — SVG animated scene ── */}
          <div style={{ ...S.card, padding: '40px 24px', marginBottom: 40, position: 'relative', overflow: 'hidden' }}>
            {/* Floor grid lines */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(180deg, transparent, rgba(99,102,241,.03))', borderTop: '1px solid rgba(255,255,255,.03)' }} />

            <svg viewBox="0 0 1000 280" style={{ width: '100%', height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
              {/* Connection lines between desks */}
              {AGENTS.map((agent, i) => {
                if (i >= AGENTS.length - 1) return null;
                const next = AGENTS[i + 1]!;
                const x1 = agent.x * 10 + 60;
                const x2 = next.x * 10 + 40;
                const y = 140;
                const isActive = i < activeA;
                return (
                  <g key={`line-${i}`}>
                    <line x1={x1} y1={y} x2={x2} y2={y} stroke={isActive ? agent.color : 'rgba(255,255,255,0.04)'} strokeWidth={isActive ? 2 : 1} strokeDasharray={isActive ? 'none' : '4 4'}>
                      {isActive && <animate attributeName="stroke-opacity" values=".4;1;.4" dur="2s" repeatCount="indefinite" />}
                    </line>
                    {isActive && (
                      <circle r="4" fill={next.color}>
                        <animateMotion dur="1.5s" repeatCount="indefinite" path={`M${x1},${y} L${x2},${y}`} />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Agent workstations */}
              {AGENTS.map((agent, i) => {
                const cx = agent.x * 10 + 50;
                const isActive = activeA === i;
                const isDone = i < activeA;
                return (
                  <g key={agent.id} onClick={() => setActiveA(i)} style={{ cursor: 'pointer' }}>
                    {/* Desk */}
                    <rect x={cx - 45} y={170} width={90} height={8} rx={4} fill={isActive ? `${agent.color}30` : 'rgba(255,255,255,0.03)'} stroke={isActive ? agent.color : 'rgba(255,255,255,0.06)'} strokeWidth={1} />
                    {/* Screen on desk */}
                    <rect x={cx - 30} y={130} width={60} height={40} rx={4} fill={isActive ? `${agent.color}15` : 'rgba(255,255,255,0.02)'} stroke={isActive ? `${agent.color}60` : 'rgba(255,255,255,0.05)'} strokeWidth={1} />
                    {/* Screen content — typing animation */}
                    {isActive && (
                      <>
                        <rect x={cx - 22} y={142} width={44} height={3} rx={1.5} fill={`${agent.color}40`}>
                          <animate attributeName="width" values="0;44;44" dur="1s" fill="freeze" />
                        </rect>
                        <rect x={cx - 22} y={149} width={30} height={3} rx={1.5} fill={`${agent.color}25`}>
                          <animate attributeName="width" values="0;30;30" dur="1.3s" fill="freeze" />
                        </rect>
                        <rect x={cx - 22} y={156} width={38} height={3} rx={1.5} fill={`${agent.color}20`}>
                          <animate attributeName="width" values="0;38;38" dur="1.6s" fill="freeze" />
                        </rect>
                      </>
                    )}
                    {isDone && (
                      <text x={cx} y={155} textAnchor="middle" fontSize={14} fill="#22c55e">&#10003;</text>
                    )}

                    {/* Agent character (person) */}
                    <g transform={`translate(${cx}, ${isActive ? 100 : 105})`}>
                      {isActive && (
                        <circle r={32} fill="none" stroke={agent.color} strokeWidth={1} opacity={0.15}>
                          <animate attributeName="r" values="28;36;28" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values=".15;.05;.15" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* Head */}
                      <circle r={12} fill={isActive ? agent.color : 'rgba(255,255,255,0.12)'}>
                        {isActive && <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="1.5s" repeatCount="indefinite" />}
                      </circle>
                      {/* Emoji face */}
                      <text y={5} textAnchor="middle" fontSize={14} style={{ pointerEvents: 'none' }}>
                        {isActive && <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="1.5s" repeatCount="indefinite" />}
                        {agent.emoji}
                      </text>
                      {/* Body */}
                      <rect x={-8} y={14} width={16} height={16} rx={4} fill={isActive ? `${agent.color}50` : 'rgba(255,255,255,0.06)'}>
                        {isActive && <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="1.5s" repeatCount="indefinite" />}
                      </rect>
                    </g>

                    {/* Data particles floating up when active */}
                    {isActive && (
                      <>
                        <text x={cx - 15} y={75} fontSize={9} fontFamily="monospace" fill={agent.color}>
                          {'{ }'}
                          <animate attributeName="y" values="80;50" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
                        </text>
                        <text x={cx + 10} y={65} fontSize={8} fontFamily="monospace" fill={`${agent.color}80`}>
                          01
                          <animate attributeName="y" values="75;40" dur="2.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values=".8;0" dur="2.5s" repeatCount="indefinite" />
                        </text>
                      </>
                    )}

                    {/* Name label */}
                    <text x={cx} y={205} textAnchor="middle" fontSize={10} fontFamily="monospace" fontWeight={700} fill={isActive ? agent.color : isDone ? '#22c55e' : 'rgba(255,255,255,0.2)'}>{agent.name}</text>
                    <text x={cx} y={220} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.25)">{agent.role}</text>

                    {/* Status badge */}
                    {isActive && (
                      <g>
                        <rect x={cx - 40} y={230} width={80} height={20} rx={10} fill={`${agent.color}15`} stroke={`${agent.color}30`} strokeWidth={1} />
                        <text x={cx} y={243} textAnchor="middle" fontSize={8} fontFamily="monospace" fill={agent.color}>{agent.verb}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Progress dots below */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {AGENTS.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div onClick={() => setActiveA(i)} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: i <= activeA ? a.color : 'rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all .3s', transform: i === activeA ? 'scale(1.4)' : 'scale(1)' }} />
                  {i < AGENTS.length - 1 && <div style={{ width: 24, height: 2, backgroundColor: i < activeA ? a.color : 'rgba(255,255,255,0.04)', transition: 'all .3s' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Active agent detail */}
          <div style={{ ...S.card, padding: 32, maxWidth: 640, margin: '0 auto', textAlign: 'center', boxShadow: `0 0 60px ${AGENTS[activeA]!.color}08` }}>
            <div style={{ fontSize: 40, marginBottom: 12, animation: 'mc-float 3s ease-in-out infinite' }}>{AGENTS[activeA]!.emoji}</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
              <span style={{ color: AGENTS[activeA]!.color }}>{AGENTS[activeA]!.name}</span>
              <span style={{ color: '#3f3f46' }}> — </span>
              <span style={{ color: '#d4d4d8' }}>{AGENTS[activeA]!.role}</span>
            </h3>
            <p style={{ ...S.t2, fontSize: 14, lineHeight: 1.7, marginTop: 12, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>{AGENTS[activeA]!.desc}</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#818cf8', marginBottom: 12 }}>// HOW IT WORKS</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>From your old site to a premium redesign in 3 steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { n: '01', icon: 'i-ph:link', t: 'Send us your URL', d: 'Just paste your existing website address. That\'s all we need to get started.' },
              { n: '02', icon: 'i-ph:cpu', t: 'Agents rebuild your site', d: '5 AI agents scan your content, analyze your market, and rebuild every page with premium design.' },
              { n: '03', icon: 'i-ph:eye', t: 'Preview and go live', d: 'Receive your new site preview within 24 hours. Review it, approve it, and we make it live.' },
            ].map(s => (
              <div key={s.n} style={{ ...S.card, padding: 24, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 56, fontWeight: 800, color: 'rgba(255,255,255,.02)' }}>{s.n}</div>
                <div className={s.icon} style={{ fontSize: 28, color: '#818cf8', marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.t}</h3>
                <p style={{ fontSize: 14, ...S.t2, lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '96px 24px', ...S.bg2 }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#818cf8', marginBottom: 12 }}>// FEATURES</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>Everything included</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.t} style={{ ...S.card, padding: 24 }}>
                <div className={f.icon} style={{ fontSize: 24, color: '#818cf8', marginBottom: 16 }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{f.t}</h3>
                <p style={{ fontSize: 14, ...S.t2, lineHeight: 1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#818cf8', marginBottom: 12 }}>// WHY SWITCH</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>Agency vs <span style={S.gt}>MadeCreative</span></h2>
          </div>
          <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 13, fontWeight: 600, backgroundColor: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ padding: 16, ...S.t4 }} /><div style={{ padding: 16, textAlign: 'center', ...S.t4 }}>Traditional</div><div style={{ padding: 16, textAlign: 'center', color: '#818cf8' }}>MadeCreative</div>
            </div>
            {COMPARISON.map((r, i) => (
              <div key={r.f} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 14, borderBottom: '1px solid rgba(255,255,255,.04)', backgroundColor: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                <div style={{ padding: 16, ...S.t2 }}>{r.f}</div>
                <div style={{ padding: 16, textAlign: 'center', ...S.t4 }}>{r.old}</div>
                <div style={{ padding: 16, textAlign: 'center', color: '#4ade80', fontWeight: 500 }}>{r.us}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', ...S.bg2 }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#818cf8', marginBottom: 12 }}>// TESTIMONIALS</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>Trusted across Europe</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={S.card}>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{Array.from({ length: 5 }, (_, i) => <span key={i} style={{ color: '#fbbf24', fontSize: 14 }}>&#9733;</span>)}</div>
                  <p style={{ fontSize: 14, ...S.t2, lineHeight: 1.6, marginBottom: 16 }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', ...S.gb, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.a}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 500, color: '#e4e4e7' }}>{t.name}</div><div style={{ fontSize: 12, ...S.t4 }}>{t.role}</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO ─────────────────────────────────────────────────────── */}
      {PORTFOLIO.length > 0 && (
        <section style={{ padding: '96px 24px', ...S.bg2 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ ...S.t3, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Our Work</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Sites We've <span style={S.gt}>Redesigned</span></h2>
            <p style={{ ...S.t2, maxWidth: 500, margin: '0 auto 48px', fontSize: 15 }}>Real businesses. Real content. Premium design upgrade.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {PORTFOLIO.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ ...S.card, overflow: 'hidden', textAlign: 'left', transition: 'transform 0.3s, box-shadow 0.3s', textDecoration: 'none', cursor: 'pointer' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(99,102,241,0.2)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                  <div style={{ height: 220, background: '#0d0d14', position: 'relative', overflow: 'hidden' }}>
                    <img src={p.screenshot} alt={`${p.name} - redesigned`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} loading="lazy" />
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(99,102,241,0.9)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>REDESIGNED</div>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{p.name}</h3>
                    <p style={{ color: '#71717a', fontSize: 13, marginBottom: 16 }}>{p.sector} — {p.city}</p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ ...S.gb, padding: '8px 20px', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600 }}>View Live Site</span>
                      <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(p.original, '_blank'); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', color: '#a1a1aa', fontSize: 13, cursor: 'pointer' }}>Original</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '96px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(99,102,241,.04), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#818cf8', marginBottom: 12 }}>// PRICING</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Simple, transparent pricing</h2>
            <p style={{ ...S.t2, maxWidth: 480, margin: '0 auto' }}>Premium redesign with hosting, domain, and support — all included.</p>
          </div>

          <div style={{ marginBottom: 48 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {PLANS.map(plan => {
              const price = plan.price;
              const isOpen = cPlan === plan.slug;
              return (
                <div key={plan.name} style={{ ...(plan.hl ? S.cardHl : S.card), padding: 24, position: 'relative', ...(plan.hl ? { boxShadow: '0 0 60px rgba(99,102,241,.08)', transform: 'scale(1.02)' } : {}) }}>
                  {plan.hl && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', ...S.gb, padding: '4px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 700, color: '#fff' }}>Most Popular</div>}
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, ...S.t4, marginTop: 4, marginBottom: 16 }}>{plan.desc}</p>
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ ...S.t4, fontSize: 18 }}>&euro;</span>
                    <span style={{ fontSize: 48, fontWeight: 800, color: '#fff' }}>{price.toFixed(2)}</span>
                    <span style={S.t4}> {plan.period === '/month' ? '/mese' : 'una tantum'}</span>
                    {plan.slug === 'PRO' && <div style={{ marginTop: 8, fontSize: 13, color: '#4ade80', fontWeight: 600 }}>30 giorni gratis</div>}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, marginBottom: 10 }}>
                        <span style={{ color: '#4ade80', fontSize: 16, lineHeight: 1.2 }}>&#10003;</span>
                        <span style={{ color: '#d4d4d8' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isOpen ? (
                    <div>
                      <input type="email" value={cEmail} onChange={e => { setCEmail(e.target.value); setCErr(''); }} placeholder="your@email.com" autoFocus onKeyDown={e => { if (e.key === 'Enter') checkout(plan.slug); }}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 16px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 8 }} />
                      {cErr && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{cErr}</p>}
                      <button onClick={() => checkout(plan.slug)} disabled={cLoad}
                        style={{ width: '100%', padding: '10px 0', borderRadius: 8, ...S.gb, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', opacity: cLoad ? .5 : 1, marginBottom: 8 }}>
                        {cLoad ? 'Redirecting...' : 'Get Started'}
                      </button>
                      <button onClick={() => { setCPlan(null); setCErr(''); }} style={{ width: '100%', fontSize: 12, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setCPlan(plan.slug); setCErr(''); }}
                      style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', ...(plan.hl ? { ...S.gb, color: '#fff' } : { backgroundColor: 'rgba(255,255,255,.05)', color: '#d4d4d8', border: '1px solid rgba(255,255,255,.06)' }) }}>
                      Get Started
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, ...S.t4, marginTop: 32 }}>&#128274; Stripe secured. Starter: pagamento unico. Pro: 30 giorni gratis, poi &euro;49/mese &mdash; disdici quando vuoi.</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', ...S.bg2 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#818cf8', marginBottom: 12 }}>// FAQ</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: '#fff' }}>Questions & answers</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={S.faq}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#e4e4e7', paddingRight: 16 }}>{faq.q}</span>
                  <span style={{ fontSize: 18, color: '#52525b', transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>&#9662;</span>
                </button>
                {openFaq === i && <div style={{ padding: '0 20px 20px' }}><p style={{ fontSize: 14, ...S.t2, lineHeight: 1.7 }}>{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Ready to see your site transformed?<br /><span style={S.gt}>Same content. 10x better design.</span></h2>
        <p style={{ ...S.t2, marginBottom: 32 }}>&euro;9.99 una tantum o &euro;49/mese con 30 giorni gratis. Scegli tu.</p>
        <a href="#pricing" style={{ display: 'inline-block', ...S.gb, padding: '14px 32px', borderRadius: 12, color: '#fff', fontWeight: 600, fontSize: 18, textDecoration: 'none' }}>Get Started</a>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ padding: '48px 24px', borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 12, ...S.t4 }}>
          <span><span style={S.gt}>MadeCreative</span> &copy; {new Date().getFullYear()}</span>
          <span>Built with AI in Munich, Germany</span>
        </div>
      </footer>

      {/* ── WHATSAPP FLOATING BUTTON ──────────────────────────────────────── */}
      <a
        href="https://wa.me/393317389918"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on WhatsApp"
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(37,211,102,0.45)',
          textDecoration: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 24px rgba(37,211,102,0.65)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(37,211,102,0.45)';
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="#ffffff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
