import type { Metadata } from "next";
import { Orbitron, Share_Tech_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
  weight: "400",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MadeCreative Admin",
    template: "%s | MadeCreative Admin",
  },
  description: "MadeCreative internal admin dashboard",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${shareTechMono.variable} ${dmSans.variable}`}
    >
      <body className="font-sans bg-bg-base text-slate-200 min-h-screen">
        {/* Animated grid background */}
        <div className="animated-grid" aria-hidden="true" />
        {/* Scan line overlay */}
        <div className="scanlines" aria-hidden="true" />
        {/* Grain overlay */}
        <div className="grain" aria-hidden="true" />
        {/* Main content above overlays */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
