import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES, getTranslations, type Locale } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { DemoSection } from "@/components/sections/DemoSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
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
      <HeroSection t={t} locale={locale} />
      <HowItWorksSection t={t} />
      <DemoSection t={t} locale={locale} />
      <FeaturesSection t={t} />
      <FaqSection t={t} />
      <FinalCtaSection t={t} locale={locale} />
      <Footer t={t} locale={locale} />
    </main>
  );
}
