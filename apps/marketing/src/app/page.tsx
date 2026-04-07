import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                Made<span className="text-blue-600">Creative</span>
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 text-sm">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm">
                Pricing
              </Link>
              <Link href="#sectors" className="text-gray-600 hover:text-gray-900 text-sm">
                Sectors
              </Link>
              <Link
                href="https://app.madecreative.pro/login"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Login
              </Link>
              <Link
                href="#pricing"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            AI-Powered Digital Marketing
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Your business online{" "}
            <span className="text-blue-600">in 7 days</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            MadeCreative builds your website, handles your SEO, manages social media,
            and generates leads — all powered by AI, starting from €297/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#pricing"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Start Today — €297/month
            </Link>
            <Link
              href="#features"
              className="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              See How It Works
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No contracts. Cancel anytime. 30-day money-back guarantee.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything your business needs
            </h2>
            <p className="text-xl text-gray-600">
              One platform. Complete digital presence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              One-time setup fee + monthly subscription
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border-2 ${
                  plan.popular
                    ? "border-blue-600 bg-blue-600 text-white shadow-xl scale-105"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="text-blue-200 text-sm font-medium mb-2">
                    Most Popular
                  </div>
                )}
                <h3
                  className={`text-xl font-bold mb-1 ${plan.popular ? "text-white" : "text-gray-900"}`}
                >
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span
                    className={`text-4xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900"}`}
                  >
                    €{plan.price}
                  </span>
                  <span className={plan.popular ? "text-blue-200" : "text-gray-500"}>
                    /month
                  </span>
                </div>
                <p
                  className={`text-sm mb-1 ${plan.popular ? "text-blue-100" : "text-gray-500"}`}
                >
                  + €{plan.setup} one-time setup
                </p>
                <ul className="space-y-3 mt-6 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-sm ${plan.popular ? "text-blue-100" : "text-gray-600"}`}
                    >
                      <span className={plan.popular ? "text-green-300" : "text-green-500"}>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/start?plan=${plan.id}`}
                  className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-lg font-bold text-gray-900">
            Made<span className="text-blue-600">Creative</span>
          </span>
          <p className="text-gray-500 text-sm mt-2">
            © {new Date().getFullYear()} MadeCreative. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-900 text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-900 text-sm">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-gray-900 text-sm">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: "🌐",
    title: "Professional Website",
    description:
      "AI-generated website tailored to your sector, deployed in 7 days with SEO optimization built-in.",
  },
  {
    icon: "🔍",
    title: "Local SEO",
    description:
      "Rank higher in local searches. We optimize your Google Business Profile and build local citations.",
  },
  {
    icon: "📱",
    title: "Social Media",
    description:
      "AI-created posts for Instagram and Facebook, scheduled and published automatically every week.",
  },
  {
    icon: "🤖",
    title: "AI Chatbot",
    description:
      "24/7 customer support chatbot trained on your business information, embedded on your website.",
  },
  {
    icon: "📧",
    title: "Automation",
    description:
      "Email sequences, lead notifications, review requests — all automated to save you hours each week.",
  },
  {
    icon: "📊",
    title: "Monthly Reports",
    description:
      "Detailed monthly performance reports showing your website traffic, leads, and revenue impact.",
  },
];

const plans = [
  {
    id: "STARTER",
    name: "Starter",
    price: 297,
    setup: 497,
    popular: false,
    features: [
      "1 professional website",
      "Local SEO optimization",
      "12 social posts/month",
      "AI chatbot",
      "3 automations",
      "50 leads/month",
      "Monthly report",
      "Email support",
    ],
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: 597,
    setup: 997,
    popular: true,
    features: [
      "3 websites",
      "Advanced SEO + Google Ads",
      "30 social posts/month",
      "2 AI chatbots",
      "10 automations",
      "200 leads/month",
      "Weekly reports",
      "Priority support",
      "AI agents enabled",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 1297,
    setup: 1997,
    popular: false,
    features: [
      "10 websites",
      "Full SEO suite + Ads",
      "90 social posts/month",
      "5 AI chatbots",
      "50 automations",
      "1000 leads/month",
      "Daily reports",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];
