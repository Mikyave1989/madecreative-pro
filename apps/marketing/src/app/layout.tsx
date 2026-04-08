import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MadeCreative — Il tuo sito professionale in 60 secondi",
    template: "%s | MadeCreative",
  },
  description: "MadeCreative crea il tuo sito web professionale con AI in 60 secondi. Chatbot 24/7, report mensile, hosting incluso. €197/mese.",
  metadataBase: new URL("https://madecreative.pro"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="scroll-smooth">
      <body className={`${inter.variable} ${syne.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
