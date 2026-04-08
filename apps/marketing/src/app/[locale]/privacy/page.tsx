import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getTranslations, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata() {
  return {
    title: "Privacy Policy | MadeCreative",
    robots: "noindex",
  };
}

const SECTIONS = [
  {
    title: "1. Titolare del trattamento",
    body: "MadeCreative (madecreative.pro) è il titolare del trattamento dei dati personali. Contatto: privacy@madecreative.pro",
  },
  {
    title: "2. Dati raccolti",
    body: "Raccogliamo: nome e indirizzo email al momento della registrazione; dati di utilizzo del servizio (visite al sito, interazioni col chatbot); dati di fatturazione gestiti da Stripe (non archiviamo dati della carta).",
  },
  {
    title: "3. Finalità del trattamento",
    body: "I dati vengono trattati per: erogare il servizio (sito web, chatbot, report); inviare comunicazioni di servizio; adempiere agli obblighi contrattuali e fiscali.",
  },
  {
    title: "4. Base giuridica",
    body: "Il trattamento si basa sull'esecuzione del contratto (Art. 6(1)(b) GDPR) e, ove applicabile, sul consenso dell'utente.",
  },
  {
    title: "5. Conservazione dei dati",
    body: "I dati sono conservati per la durata del contratto e per i successivi 5 anni per obblighi fiscali. Su richiesta, i dati vengono cancellati entro 24 ore dalla cessazione del servizio.",
  },
  {
    title: "6. Diritti dell'utente",
    body: "L'utente ha diritto di: accedere ai propri dati, rettificarli, cancellarli, opporsi al trattamento, richiedere la portabilità. Per esercitare questi diritti: privacy@madecreative.pro",
  },
  {
    title: "7. Cookie",
    body: "Utilizziamo cookie tecnici essenziali per il funzionamento del servizio e cookie analitici anonimi (Plausible Analytics, senza dati personali). Non utilizziamo cookie di profilazione.",
  },
  {
    title: "8. Trasferimento dati",
    body: "I dati sono archiviati in server EU (Supabase Frankfurt, Vercel EU). Non trasferisce dati fuori dall'UE.",
  },
];

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) notFound();
  const t = getTranslations(locale as Locale);

  return (
    <div style={{ background: "#05070f", minHeight: "100vh", color: "#f8fafc" }}>
      <Nav t={t} locale={locale as Locale} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-24">
        <h1
          className="font-heading text-3xl sm:text-4xl font-bold mb-2"
          style={{ color: "#818cf8" }}
        >
          Privacy Policy
        </h1>
        <p
          className="text-sm mb-10"
          style={{ color: "rgba(248,250,252,0.4)" }}
        >
          Ultimo aggiornamento:{" "}
          {new Date().toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>

        {SECTIONS.map(({ title, body }) => (
          <section key={title} className="mb-8">
            <h2
              className="font-heading text-lg font-semibold mb-2"
              style={{ color: "#f8fafc" }}
            >
              {title}
            </h2>
            <p
              style={{
                color: "rgba(248,250,252,0.6)",
                lineHeight: "1.7",
                fontSize: "0.95rem",
              }}
            >
              {body}
            </p>
          </section>
        ))}
      </main>
      <Footer t={t} locale={locale as Locale} />
    </div>
  );
}
