import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MadeCreative — AI-Powered Digital Marketing for SMBs",
    template: "%s | MadeCreative",
  },
  description:
    "MadeCreative uses AI to give small and medium businesses a complete digital presence: professional website, local SEO, social media, and lead generation — all automated.",
  keywords: [
    "digital marketing",
    "AI website",
    "local SEO",
    "social media automation",
    "small business",
    "lead generation",
  ],
  authors: [{ name: "MadeCreative" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://madecreative.pro",
    siteName: "MadeCreative",
    title: "MadeCreative — AI-Powered Digital Marketing for SMBs",
    description:
      "Complete digital marketing solution powered by AI. Get your business online in 7 days.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MadeCreative — AI-Powered Digital Marketing",
    description: "AI digital marketing for small businesses. Website + SEO + Social + Leads.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
