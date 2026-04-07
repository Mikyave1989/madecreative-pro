import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES, getTranslations, type Locale } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { AgentFloorSection } from "@/components/sections/AgentFloorSection";
import { ResultsSection } from "@/components/sections/ResultsSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { DemoSection } from "@/components/sections/DemoSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  const t = getTranslations(locale as Locale);

  return (
    <main>
      <Nav t={t} locale={locale as Locale} />

      {/* 1. HERO */}
      <HeroSection t={t} locale={locale} />

      {/* 2. PROBLEMA */}
      <ProblemSection t={t} />

      {/* 3. COME FUNZIONA */}
      <HowItWorksSection t={t} />

      {/* 4. AGENT FLOOR */}
      <AgentFloorSection t={t} />

      {/* 5. RISULTATI */}
      <ResultsSection t={t} />

      {/* 6. COSA INCLUDE */}
      <FeaturesSection t={t} />

      {/* 7. DEMO LIVE */}
      <DemoSection t={t} locale={locale} />

      {/* 8. PRICING */}
      <PricingSection t={t} />

      {/* 9. FAQ */}
      <FaqSection t={t} />

      {/* 10. CTA FINALE */}
      <FinalCtaSection t={t} locale={locale} />

      <Footer t={t} locale={locale} />
    </main>
  );
}
