import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES, getTranslations, type Locale } from "@/lib/i18n";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    return {};
  }

  const t = getTranslations(locale as Locale);

  const alternates: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    alternates[loc] = `https://madecreative.pro/${loc}`;
  }

  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      languages: alternates,
      canonical: `https://madecreative.pro/${locale}`,
    },
    openGraph: {
      type: "website",
      locale,
      url: `https://madecreative.pro/${locale}`,
      siteName: "MadeCreative",
      title: t.meta.title,
      description: t.meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  return <>{children}</>;
}
