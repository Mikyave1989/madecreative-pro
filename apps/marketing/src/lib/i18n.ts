export type Locale = "de" | "it" | "es" | "fr" | "nl" | "pt" | "en";

export const DEFAULT_LOCALE: Locale = "de";

export const SUPPORTED_LOCALES: Locale[] = ["de", "it", "es", "fr", "nl", "pt", "en"];

export const LOCALE_NAMES: Record<Locale, string> = {
  de: "Deutsch",
  it: "Italiano",
  es: "Español",
  fr: "Français",
  nl: "Nederlands",
  pt: "Português",
  en: "English",
};

export interface Translations {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    howItWorks: string;
    demo: string;
    faq: string;
    startFree: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    cta: string;
    ctaSecondary: string;
    trustNote: string;
  };
  howItWorks: {
    sectionLabel: string;
    title: string;
    subtitle: string;
    steps: Array<{
      number: string;
      title: string;
      description: string;
    }>;
  };
  features: {
    sectionLabel: string;
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  demo: {
    sectionLabel: string;
    title: string;
    subtitle: string;
    namePlaceholder: string;
    sectorPlaceholder: string;
    cityPlaceholder: string;
    cta: string;
    loading: string;
    successTitle: string;
    successSubtitle: string;
    successNote: string;
  };
  faq: {
    sectionLabel: string;
    title: string;
    items: Array<{
      q: string;
      a: string;
    }>;
  };
  finalCta: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
    trustNote: string;
  };
  footer: {
    tagline: string;
    copyright: string;
    links: {
      privacy: string;
      cookies: string;
      impressum: string;
      terms: string;
    };
  };
  demoPage: {
    metaTitle: string;
    metaDescription: string;
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    labelCompany: string;
    labelSector: string;
    labelCity: string;
    labelCountry: string;
    sectorOptions: Array<{ value: string; label: string }>;
    countryPlaceholder: string;
    cta: string;
    terminalSteps: string[];
    previewTitle: string;
    previewSubtitle: string;
    statsLighthouse: string;
    statsLoad: string;
    statsMobile: string;
    previewCta: string;
    previewCtaNote: string;
    tryAgain: string;
  };
  prezziPage: {
    metaTitle: string;
    metaDescription: string;
    badge: string;
    title: string;
    subtitle: string;
    monthly: string;
    annual: string;
    annualDiscount: string;
    perMonth: string;
    setupFee: string;
    mostPopular: string;
    getStarted: string;
    moneyBack: string;
    moneyBackTitle: string;
    moneyBackDesc: string;
    savingsLabel: string;
    billedAnnually: string;
    compareTitle: string;
    faqTitle: string;
    tableCategories: {
      website: string;
      marketing: string;
      ai: string;
      support: string;
    };
    tableFeatures: {
      websites: string;
      customDomain: string;
      ssl: string;
      gdpr: string;
      privacy: string;
      socialPosts: string;
      leads: string;
      seo: string;
      googleAds: string;
      chatbots: string;
      automations: string;
      aiAgents: string;
      emailSupport: string;
      prioritySupport: string;
      accountManager: string;
      phoneSupport: string;
    };
    seoBasic: string;
    seoAdvanced: string;
    seoFull: string;
    plans: Array<{
      name: string;
      description: string;
      features: string[];
    }>;
  };
}

export const translations: Record<Locale, Translations> = {
  de: {
    meta: {
      title: "MadeCreative — KI-gestützte Website in 60 Sekunden",
      description:
        "MadeCreative erstellt Ihre professionelle Website in 60 Sekunden mit KI. AI-Editor, Chatbot, WhatsApp, SEO — alles automatisiert. Ab €25/Monat.",
    },
    nav: {
      howItWorks: "So funktioniert's",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Kostenlos starten",
    },
    hero: {
      badge: "KI-gestütztes digitales Marketing",
      title: "Deine Website",
      titleHighlight: "in 60 Sekunden",
      subtitle:
        "MadeCreative erstellt deine Website mit KI, inklusive AI-Editor, Chatbot, WhatsApp-Widget, Menü-Editor und automatischer SEO — ab €25/Monat.",
      cta: "Starte ab €25/Monat",
      ctaSecondary: "So funktioniert's",
      trustNote: "Keine Kreditkarte erforderlich. Jederzeit kündbar.",
    },
    howItWorks: {
      sectionLabel: "So funktioniert's",
      title: "Von Null zur fertigen Website in 3 Schritten",
      subtitle: "Unser KI-System analysiert dein Unternehmen und erstellt alles automatisch.",
      steps: [
        {
          number: "01",
          title: "Scraping & Analyse",
          description:
            "Unser KI-Agent analysiert deine bestehende Online-Präsenz, deinen Sektor und deine Mitbewerber. In wenigen Sekunden.",
        },
        {
          number: "02",
          title: "Generierung & Preview",
          description:
            "Die KI erstellt deine maßgeschneiderte Website mit Texten, Design und SEO-Optimierung. Du siehst eine Live-Preview.",
        },
        {
          number: "03",
          title: "Launch & Automatisierung",
          description:
            "Mit einem Klick geht deine Website live. Chatbot, Social Media und E-Mail-Automation starten sofort.",
        },
      ],
    },
    features: {
      sectionLabel: "Was enthalten ist",
      title: "Alles, was dein Unternehmen braucht",
      subtitle: "Eine Plattform. Vollständige digitale Präsenz. Ab €25/Monat.",
      items: [
        {
          title: "AI-Editor (wie Lovable)",
          description:
            "Bearbeite deine Website per Chat mit KI. Sag was du willst — die KI ändert es sofort. Inklusive Live-Preview.",
        },
        {
          title: "WhatsApp-Widget",
          description:
            "Ein Klick und deine Kunden erreichen dich per WhatsApp. Automatisch auf deiner Website eingebettet.",
        },
        {
          title: "Menü & Preisliste",
          description:
            "Füge Produkte, Gerichte oder Dienstleistungen mit Preisen und Fotos hinzu. Wird als eigene Seite generiert.",
        },
        {
          title: "KI-Chatbot 24/7",
          description:
            "Beantwortet Kundenfragen, bucht Termine und sammelt Leads — rund um die Uhr, trainiert auf dein Business.",
        },
        {
          title: "Eigene Domain + SSL",
          description:
            "Verbinde deinen eigenen Domainnamen. SSL-Zertifikat, CDN und Hosting sind inklusive.",
        },
        {
          title: "Rollback & Versionen",
          description:
            "Jede Änderung wird gespeichert. Nicht zufrieden? Ein Klick und du gehst zur vorherigen Version zurück.",
        },
      ],
    },
    demo: {
      sectionLabel: "Live Demo",
      title: "Sieh es selbst",
      subtitle: "Gib die Daten deines Unternehmens ein und sieh, was unsere KI in Sekunden erstellt.",
      namePlaceholder: "z.B. Bäckerei Schmidt",
      sectorPlaceholder: "z.B. Restaurant, Friseur, Zahnarzt...",
      cityPlaceholder: "z.B. München",
      cta: "Website-Preview generieren",
      loading: "KI generiert deine Preview...",
      successTitle: "Deine Preview ist bereit!",
      successSubtitle:
        "Unsere KI hat in Sekunden eine maßgeschneiderte Website für dein Unternehmen erstellt.",
      successNote: "Starte jetzt und deine echte Website geht in 60 Sekunden live.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Häufig gestellte Fragen",
      items: [
        {
          q: "Muss ich etwas konfigurieren?",
          a: "Nein. Unser System findet dein Unternehmen, erstellt die Website und stellt sie automatisch online. Du musst nichts tun.",
        },
        {
          q: "Kann ich die Website bearbeiten?",
          a: "Ja. Im Kundenportal hast du einen Self-Service-Editor. Du änderst Texte, Fotos, Öffnungszeiten und Telefonnummer. In 2 Minuten wird die Website aktualisiert.",
        },
        {
          q: "Wie kündige ich das Abonnement?",
          a: "Ein Klick im Portal genügt. Die Website geht innerhalb von 24 Stunden offline. Keine Kündigungsfrist, keine Strafgebühr.",
        },
        {
          q: "Was, wenn mir die Website nicht gefällt?",
          a: "Automatische Rückerstattung innerhalb von 14 Tagen nach Abschluss. Kein Ticket, kein Anruf. Nur ein Klick.",
        },
        {
          q: "Funktioniert es für meine Branche?",
          a: "Ja: Restaurants, Zahnärzte, Anwaltskanzleien, Fitnessstudios, Schönheitssalons, Hotels, Geschäfte, Freiberufler.",
        },
      ],
    },
    finalCta: {
      badge: "Bereit loszulegen?",
      title: "Deine Website ist 60 Sekunden entfernt",
      subtitle:
        "Tritt den 127+ Unternehmen bei, die bereits mit MadeCreative online sind und täglich neue Kunden gewinnen.",
      cta: "Jetzt kostenlos starten",
      trustNote: "Keine Kreditkarte. Kein Vertrag. Sofortiger Start.",
    },
    footer: {
      tagline: "Digitales Marketing, vollständig durch KI betrieben.",
      copyright: "© 2026 madecreative.pro — Zero Mitarbeiter. 100% KI.",
      links: {
        privacy: "Datenschutz",
        cookies: "Cookie-Richtlinie",
        impressum: "Impressum",
        terms: "AGB",
      },
    },
    demoPage: {
      metaTitle: "Live Demo — MadeCreative",
      metaDescription: "Sieh in Echtzeit, wie unsere KI eine professionelle Website für dein Unternehmen erstellt.",
      badge: "Live Demo",
      title: "Erlebe die KI",
      titleHighlight: "in Echtzeit",
      subtitle: "Gib die Daten deines Unternehmens ein und sieh, wie unsere KI in Sekunden eine professionelle Website erstellt.",
      labelCompany: "Unternehmensname",
      labelSector: "Branche",
      labelCity: "Stadt",
      labelCountry: "Land",
      sectorOptions: [
        { value: "ristorazione", label: "Restaurant & Gastronomie" },
        { value: "dental", label: "Zahnarzt" },
        { value: "legale", label: "Rechtsanwalt" },
        { value: "fitness", label: "Fitness & Sport" },
        { value: "beauty", label: "Beauty & Wellness" },
        { value: "hotel", label: "Hotel & Unterkunft" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Einzelhandel" },
        { value: "professional", label: "Professionelle Dienstleistungen" },
      ],
      countryPlaceholder: "z.B. Deutschland",
      cta: "Website-Preview generieren",
      terminalSteps: [
        "Google Maps wird gescrapt...",
        "Konkurrenten werden analysiert...",
        "Design System wird generiert...",
        "Website wird erstellt...",
        "Performance wird optimiert...",
      ],
      previewTitle: "Deine Preview ist fertig!",
      previewSubtitle: "KI hat in Sekunden eine maßgeschneiderte Website erstellt.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Ladezeit: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Hol dir deine echte Website",
      previewCtaNote: "Keine Kreditkarte erforderlich",
      tryAgain: "Nochmals versuchen",
    },
    prezziPage: {
      metaTitle: "Preise — MadeCreative",
      metaDescription: "Transparente Preise ohne versteckte Gebühren. Starter ab €25/Monat. 30-Tage Geld-zurück-Garantie.",
      badge: "Transparente Preise",
      title: "Preise",
      subtitle: "Einmalige Setup-Gebühr + monatliches Abo. Jederzeit kündbar.",
      monthly: "Monatlich",
      annual: "Jährlich",
      annualDiscount: "-20%",
      perMonth: "/Monat",
      setupFee: "Einmalige Setup-Gebühr",
      mostPopular: "Beliebteste",
      getStarted: "Jetzt starten",
      moneyBack: "30-Tage Geld-zurück-Garantie",
      moneyBackTitle: "30-Tage Geld-zurück-Garantie",
      moneyBackDesc: "Nicht zufrieden in den ersten 30 Tagen? Wir erstatten sowohl die Setup-Gebühr als auch die erste Monatszahlung. Ohne Fragen.",
      savingsLabel: "Du sparst €{n}/Jahr",
      billedAnnually: "Jährlich abgerechnet €{n}/Jahr",
      compareTitle: "Vollständiger Funktionsvergleich",
      faqTitle: "Häufig gestellte Fragen",
      tableCategories: {
        website: "Website",
        marketing: "Marketing",
        ai: "KI & Automation",
        support: "Support",
      },
      tableFeatures: {
        websites: "Enthaltene Websites",
        customDomain: "Custom Domain",
        ssl: "SSL-Zertifikat",
        gdpr: "Cookie-Banner (DSGVO)",
        privacy: "Datenschutzerklärung",
        socialPosts: "Social Posts/Monat",
        leads: "Leads/Monat",
        seo: "SEO-Optimierung",
        googleAds: "Google Ads Management",
        chatbots: "KI-Chatbots",
        automations: "Automationen",
        aiAgents: "KI-Agenten",
        emailSupport: "E-Mail-Support",
        prioritySupport: "Priority Support",
        accountManager: "Dedicated Account Manager",
        phoneSupport: "Telefon-Support",
      },
      seoBasic: "Basis",
      seoAdvanced: "Fortgeschritten",
      seoFull: "Full Suite",
      plans: [
        {
          name: "Starter",
          description: "Perfekt für kleine Unternehmen, die online durchstarten.",
          features: [
            "1 professionelle Website",
            "SSL-Zertifikat",
            "Lokale SEO-Optimierung",
            "12 Social Posts/Monat",
            "KI-Chatbot (24/7)",
            "3 Automationen",
            "50 Leads/Monat",
            "Monatlicher Report",
            "E-Mail-Support",
          ],
        },
        {
          name: "Growth",
          description: "Für wachsende Unternehmen mit mehr Power und Reichweite.",
          features: [
            "3 professionelle Websites",
            "Custom Domain inklusive",
            "Advanced SEO + Google Business",
            "30 Social Posts/Monat",
            "2 KI-Chatbots",
            "10 Automationen",
            "200 Leads/Monat",
            "Wöchentliche Reports",
            "Priority Support",
            "KI-Agenten aktiviert",
          ],
        },
        {
          name: "Enterprise",
          description: "Full-Service digitales Marketing für etablierte Unternehmen.",
          features: [
            "10 Websites",
            "Mehrere Custom Domains",
            "Full SEO Suite + Google Ads",
            "90 Social Posts/Monat",
            "5 KI-Chatbots",
            "50 Automationen",
            "1000 Leads/Monat",
            "Tägliche Reports",
            "Dedicated Account Manager",
            "Custom Integrationen",
          ],
        },
      ],
    },
  },

  it: {
    meta: {
      title: "MadeCreative — Sito web AI in 60 secondi",
      description:
        "MadeCreative crea il tuo sito con l'AI in 60 secondi. AI Editor, chatbot, WhatsApp, menu editor, SEO — tutto automatizzato. Da €25/mese.",
    },
    nav: {
      howItWorks: "Come funziona",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Inizia gratis",
    },
    hero: {
      badge: "Marketing digitale alimentato dall'AI",
      title: "Il tuo sito web",
      titleHighlight: "in 60 secondi",
      subtitle:
        "MadeCreative costruisce il tuo sito professionale, gestisce il SEO, i social media e genera lead — tutto automatizzato dall'AI.",
      cta: "Genera il tuo sito gratis in 60 secondi",
      ctaSecondary: "Come funziona",
      trustNote: "Nessuna carta di credito. Cancella quando vuoi.",
    },
    howItWorks: {
      sectionLabel: "Come Funziona",
      title: "Da zero al sito completo in 3 step",
      subtitle: "Il nostro sistema AI analizza la tua azienda e crea tutto automaticamente.",
      steps: [
        {
          number: "01",
          title: "Scraping & Analisi",
          description:
            "Il nostro agente AI analizza la tua presenza online esistente, il settore e i concorrenti. In pochi secondi.",
        },
        {
          number: "02",
          title: "Generazione & Preview",
          description:
            "L'AI crea il tuo sito personalizzato con testi, design e ottimizzazione SEO. Vedi una preview in tempo reale.",
        },
        {
          number: "03",
          title: "Lancio & Automazione",
          description:
            "Con un clic il tuo sito va live. Chatbot, social media e automazione email partono immediatamente.",
        },
      ],
    },
    features: {
      sectionLabel: "Cosa Include",
      title: "Tutto ciò che serve alla tua azienda",
      subtitle: "Una piattaforma. Presenza digitale completa. Da €25/mese.",
      items: [
        {
          title: "AI Editor (stile Lovable)",
          description:
            "Modifica il tuo sito parlando con l'AI. Dì cosa vuoi — l'AI lo fa subito. Preview live in tempo reale.",
        },
        {
          title: "Widget WhatsApp",
          description:
            "Un click e i tuoi clienti ti contattano su WhatsApp. Inserisci il numero e appare automaticamente sul sito.",
        },
        {
          title: "Menu e Listino Prezzi",
          description:
            "Aggiungi prodotti, piatti o servizi con prezzi e foto. Viene creata una pagina dedicata sul tuo sito.",
        },
        {
          title: "Chatbot AI 24/7",
          description:
            "Risponde alle domande, prenota appuntamenti e cattura lead — sempre attivo, addestrato sul tuo business.",
        },
        {
          title: "Dominio + SSL Custom",
          description:
            "Collega il tuo dominio personalizzato. Certificato SSL, CDN e hosting inclusi nel prezzo.",
        },
        {
          title: "Rollback e Versioni",
          description:
            "Ogni modifica viene salvata. Non ti piace? Un click e torni alla versione precedente.",
        },
      ],
    },
    demo: {
      sectionLabel: "Demo Live",
      title: "Vedilo tu stesso",
      subtitle:
        "Inserisci i dati della tua azienda e guarda cosa crea la nostra AI in pochi secondi.",
      namePlaceholder: "es. Pizzeria Bella Italia",
      sectorPlaceholder: "es. Ristorante, Parrucchiere, Dentista...",
      cityPlaceholder: "es. Milano",
      cta: "Genera preview sito",
      loading: "L'AI sta generando la tua preview...",
      successTitle: "La tua preview è pronta!",
      successSubtitle:
        "La nostra AI ha creato in secondi un sito personalizzato per la tua azienda.",
      successNote: "Inizia ora e il tuo sito reale sarà live in 60 secondi.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Domande frequenti",
      items: [
        {
          q: "Devo fare qualcosa per configurarlo?",
          a: "No. Il nostro sistema trova la tua attività, crea il sito e lo mette online automaticamente. Tu non tocchi nulla.",
        },
        {
          q: "Posso modificare il sito?",
          a: "Sì. Dal portale cliente hai un editor self-service. Cambi testi, foto, orari e telefono. In 2 minuti il sito si aggiorna.",
        },
        {
          q: "Come cancello l'abbonamento?",
          a: "Un click dal portale. Il sito va offline entro 24 ore. Nessun preavviso, nessuna penale.",
        },
        {
          q: "E se il sito non mi piace?",
          a: "Rimborso automatico entro 14 giorni dalla sottoscrizione. Nessun ticket, nessuna chiamata. Solo un click.",
        },
        {
          q: "Funziona per il mio settore?",
          a: "Sì: ristoranti, dentisti, studi legali, palestre, centri estetici, hotel, negozi, professionisti.",
        },
      ],
    },
    finalCta: {
      badge: "Pronto a iniziare?",
      title: "Il tuo sito è a 60 secondi di distanza",
      subtitle:
        "Unisciti alle 127+ aziende già online con MadeCreative che ogni giorno acquisiscono nuovi clienti.",
      cta: "Inizia gratis ora",
      trustNote: "Nessuna carta di credito. Nessun contratto. Inizio immediato.",
    },
    footer: {
      tagline: "Marketing digitale completamente alimentato dall'AI.",
      copyright: "© 2026 madecreative.pro — Zero dipendenti. 100% AI.",
      links: {
        privacy: "Privacy Policy",
        cookies: "Cookie Policy",
        impressum: "Impressum",
        terms: "Termini",
      },
    },
    demoPage: {
      metaTitle: "Demo Live — MadeCreative",
      metaDescription: "Guarda in tempo reale come la nostra AI crea un sito professionale per la tua azienda.",
      badge: "Demo Live",
      title: "Vedi l'AI",
      titleHighlight: "in azione",
      subtitle: "Inserisci i dati della tua azienda e guarda come la nostra AI crea un sito professionale in pochi secondi.",
      labelCompany: "Nome azienda",
      labelSector: "Settore",
      labelCity: "Città",
      labelCountry: "Paese",
      sectorOptions: [
        { value: "ristorazione", label: "Ristorazione" },
        { value: "dental", label: "Studio Dentistico" },
        { value: "legale", label: "Studio Legale" },
        { value: "fitness", label: "Fitness & Sport" },
        { value: "beauty", label: "Beauty & Benessere" },
        { value: "hotel", label: "Hotel & Ospitalità" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Retail & Negozi" },
        { value: "professional", label: "Servizi Professionali" },
      ],
      countryPlaceholder: "es. Italia",
      cta: "Genera preview sito",
      terminalSteps: [
        "Scraping Google Maps...",
        "Analizzando competitor...",
        "Generando design system...",
        "Costruendo il sito...",
        "Ottimizzando performance...",
      ],
      previewTitle: "La tua preview è pronta!",
      previewSubtitle: "La nostra AI ha creato un sito personalizzato in pochi secondi.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Caricamento: 1.2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Ottieni il tuo sito vero",
      previewCtaNote: "Nessuna carta di credito richiesta",
      tryAgain: "Riprova",
    },
    prezziPage: {
      metaTitle: "Prezzi — MadeCreative",
      metaDescription: "Prezzi trasparenti senza costi nascosti. Starter da €25/mese. Garanzia 30 giorni soddisfatti o rimborsati.",
      badge: "Prezzi Trasparenti",
      title: "Prezzi",
      subtitle: "Costo di setup una tantum + abbonamento mensile. Cancella quando vuoi.",
      monthly: "Mensile",
      annual: "Annuale",
      annualDiscount: "-20%",
      perMonth: "/mese",
      setupFee: "Costo di setup una tantum",
      mostPopular: "Più popolare",
      getStarted: "Inizia ora",
      moneyBack: "Garanzia 30 giorni o rimborso",
      moneyBackTitle: "Garanzia 30 giorni o rimborso",
      moneyBackDesc: "Non soddisfatto nei primi 30 giorni? Rimborsiamo sia il costo di setup che il primo mese. Senza domande.",
      savingsLabel: "Risparmi €{n}/anno",
      billedAnnually: "Fatturato annualmente €{n}/anno",
      compareTitle: "Confronto completo delle funzionalità",
      faqTitle: "Domande frequenti",
      tableCategories: {
        website: "Sito Web",
        marketing: "Marketing",
        ai: "AI & Automazione",
        support: "Supporto",
      },
      tableFeatures: {
        websites: "Siti web inclusi",
        customDomain: "Dominio personalizzato",
        ssl: "Certificato SSL",
        gdpr: "Cookie banner (GDPR)",
        privacy: "Privacy policy",
        socialPosts: "Post social/mese",
        leads: "Lead/mese",
        seo: "Ottimizzazione SEO",
        googleAds: "Gestione Google Ads",
        chatbots: "Chatbot AI",
        automations: "Automazioni",
        aiAgents: "Agenti AI",
        emailSupport: "Supporto email",
        prioritySupport: "Supporto prioritario",
        accountManager: "Account manager dedicato",
        phoneSupport: "Supporto telefonico",
      },
      seoBasic: "Base",
      seoAdvanced: "Avanzato",
      seoFull: "Suite completa",
      plans: [
        {
          name: "Starter",
          description: "Perfetto per piccole imprese che iniziano online.",
          features: [
            "1 sito web professionale",
            "Certificato SSL",
            "Ottimizzazione SEO locale",
            "12 post social/mese",
            "Chatbot AI (24/7)",
            "3 automazioni",
            "50 lead/mese",
            "Report mensile",
            "Supporto email",
          ],
        },
        {
          name: "Growth",
          description: "Per aziende in crescita che hanno bisogno di più potenza.",
          features: [
            "3 siti web professionali",
            "Dominio personalizzato incluso",
            "SEO avanzato + Google Business",
            "30 post social/mese",
            "2 chatbot AI",
            "10 automazioni",
            "200 lead/mese",
            "Report settimanali",
            "Supporto prioritario",
            "Agenti AI attivati",
          ],
        },
        {
          name: "Enterprise",
          description: "Marketing digitale full-service per aziende affermate.",
          features: [
            "10 siti web",
            "Più domini personalizzati",
            "SEO suite completa + Google Ads",
            "90 post social/mese",
            "5 chatbot AI",
            "50 automazioni",
            "1000 lead/mese",
            "Report giornalieri",
            "Account manager dedicato",
            "Integrazioni personalizzate",
          ],
        },
      ],
    },
  },

  es: {
    meta: {
      title: "MadeCreative — Sitio web con IA en 60 segundos",
      description:
        "MadeCreative crea tu sitio profesional en 60 segundos con IA. SEO local, redes sociales, chatbot y leads — completamente automatizado. Desde €25/mes.",
    },
    nav: {
      howItWorks: "Cómo funciona",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Empieza gratis",
    },
    hero: {
      badge: "Marketing digital impulsado por IA",
      title: "Tu sitio web",
      titleHighlight: "en 60 segundos",
      subtitle:
        "MadeCreative construye tu sitio profesional, gestiona el SEO, las redes sociales y genera leads — todo automatizado por IA.",
      cta: "Genera tu sitio gratis en 60 segundos",
      ctaSecondary: "Cómo funciona",
      trustNote: "Sin tarjeta de crédito. Cancela cuando quieras.",
    },
    howItWorks: {
      sectionLabel: "Cómo Funciona",
      title: "De cero al sitio completo en 3 pasos",
      subtitle: "Nuestro sistema IA analiza tu empresa y lo crea todo automáticamente.",
      steps: [
        {
          number: "01",
          title: "Scraping & Análisis",
          description:
            "Nuestro agente IA analiza tu presencia online existente, tu sector y competidores. En segundos.",
        },
        {
          number: "02",
          title: "Generación & Preview",
          description:
            "La IA crea tu sitio personalizado con textos, diseño y optimización SEO. Ves una preview en tiempo real.",
        },
        {
          number: "03",
          title: "Lanzamiento & Automatización",
          description:
            "Con un clic tu sitio va live. Chatbot, redes sociales y automatización de email arrancan inmediatamente.",
        },
      ],
    },
    features: {
      sectionLabel: "Qué Incluye",
      title: "Todo lo que necesita tu empresa",
      subtitle: "Una plataforma. Presencia digital completa.",
      items: [
        {
          title: "Sitio Web Profesional",
          description:
            "Sitio generado por IA adaptado a tu sector, desplegado en 60 segundos con SEO integrado.",
        },
        {
          title: "SEO Local",
          description:
            "Mejor posición en búsquedas locales. Optimizamos tu Google Business Profile.",
        },
        {
          title: "Redes Sociales",
          description:
            "Posts creados por IA para Instagram y Facebook, programados y publicados automáticamente.",
        },
        {
          title: "Chatbot IA",
          description:
            "Chatbot de soporte 24/7 entrenado con los datos de tu empresa, integrado en tu sitio.",
        },
        {
          title: "Automatización",
          description:
            "Secuencias email, notificaciones lead, solicitudes de reseñas — todo automatizado.",
        },
        {
          title: "Informes Mensuales",
          description:
            "Informes mensuales detallados sobre tráfico, leads e impacto en facturación.",
        },
      ],
    },
    demo: {
      sectionLabel: "Demo en Vivo",
      title: "Véalo tú mismo",
      subtitle:
        "Introduce los datos de tu empresa y observa lo que nuestra IA crea en segundos.",
      namePlaceholder: "ej. Restaurante García",
      sectorPlaceholder: "ej. Restaurante, Peluquería, Dentista...",
      cityPlaceholder: "ej. Madrid",
      cta: "Generar preview del sitio",
      loading: "La IA está generando tu preview...",
      successTitle: "¡Tu preview está lista!",
      successSubtitle: "Nuestra IA ha creado en segundos un sitio personalizado para tu empresa.",
      successNote: "Empieza ahora y tu sitio real estará live en 60 segundos.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Necesito configurar algo?",
          a: "No. Nuestro sistema encuentra tu negocio, crea el sitio y lo publica en línea automáticamente. No tienes que hacer nada.",
        },
        {
          q: "¿Puedo editar el sitio?",
          a: "Sí. Desde el portal de cliente tienes un editor self-service. Cambias textos, fotos, horarios y teléfono. En 2 minutos el sitio se actualiza.",
        },
        {
          q: "¿Cómo cancelo la suscripción?",
          a: "Un clic desde el portal. El sitio queda offline en 24 horas. Sin preaviso, sin penalización.",
        },
        {
          q: "¿Y si el sitio no me gusta?",
          a: "Reembolso automático en 14 días desde la suscripción. Sin ticket, sin llamada. Solo un clic.",
        },
        {
          q: "¿Funciona para mi sector?",
          a: "Sí: restaurantes, dentistas, despachos legales, gimnasios, centros de estética, hoteles, tiendas, profesionales.",
        },
      ],
    },
    finalCta: {
      badge: "¿Listo para empezar?",
      title: "Tu sitio web está a 60 segundos",
      subtitle:
        "Únete a las 127+ empresas ya online con MadeCreative que cada día consiguen nuevos clientes.",
      cta: "Empezar gratis ahora",
      trustNote: "Sin tarjeta de crédito. Sin contrato. Inicio inmediato.",
    },
    footer: {
      tagline: "Marketing digital completamente impulsado por IA.",
      copyright: "© 2026 madecreative.pro — Cero empleados. 100% IA.",
      links: {
        privacy: "Política de Privacidad",
        cookies: "Política de Cookies",
        impressum: "Aviso Legal",
        terms: "Términos",
      },
    },
    demoPage: {
      metaTitle: "Demo en Vivo — MadeCreative",
      metaDescription: "Mira en tiempo real cómo nuestra IA crea un sitio profesional para tu empresa.",
      badge: "Demo en Vivo",
      title: "Ve la IA",
      titleHighlight: "en acción",
      subtitle: "Introduce los datos de tu empresa y observa cómo nuestra IA crea un sitio profesional en segundos.",
      labelCompany: "Nombre de la empresa",
      labelSector: "Sector",
      labelCity: "Ciudad",
      labelCountry: "País",
      sectorOptions: [
        { value: "ristorazione", label: "Restauración" },
        { value: "dental", label: "Clínica Dental" },
        { value: "legale", label: "Despacho Legal" },
        { value: "fitness", label: "Fitness & Deporte" },
        { value: "beauty", label: "Beauty & Bienestar" },
        { value: "hotel", label: "Hotel & Alojamiento" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Comercio" },
        { value: "professional", label: "Servicios Profesionales" },
      ],
      countryPlaceholder: "ej. España",
      cta: "Generar preview del sitio",
      terminalSteps: [
        "Scrapeando Google Maps...",
        "Analizando competidores...",
        "Generando sistema de diseño...",
        "Construyendo el sitio...",
        "Optimizando rendimiento...",
      ],
      previewTitle: "¡Tu preview está lista!",
      previewSubtitle: "Nuestra IA ha creado un sitio personalizado en segundos.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Carga: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Obtén tu sitio real",
      previewCtaNote: "Sin tarjeta de crédito",
      tryAgain: "Intentar de nuevo",
    },
    prezziPage: {
      metaTitle: "Precios — MadeCreative",
      metaDescription: "Precios transparentes sin costes ocultos. Starter desde €25/mes. Garantía 30 días.",
      badge: "Precios Transparentes",
      title: "Precios",
      subtitle: "Coste de setup único + suscripción mensual. Cancela cuando quieras.",
      monthly: "Mensual",
      annual: "Anual",
      annualDiscount: "-20%",
      perMonth: "/mes",
      setupFee: "Coste de setup único",
      mostPopular: "Más popular",
      getStarted: "Empezar ahora",
      moneyBack: "Garantía de devolución 30 días",
      moneyBackTitle: "Garantía de devolución 30 días",
      moneyBackDesc: "¿No satisfecho en los primeros 30 días? Reembolsamos tanto el setup como el primer mes. Sin preguntas.",
      savingsLabel: "Ahorras €{n}/año",
      billedAnnually: "Facturado anualmente €{n}/año",
      compareTitle: "Comparativa completa de funcionalidades",
      faqTitle: "Preguntas frecuentes",
      tableCategories: {
        website: "Sitio Web",
        marketing: "Marketing",
        ai: "IA & Automatización",
        support: "Soporte",
      },
      tableFeatures: {
        websites: "Sitios web incluidos",
        customDomain: "Dominio personalizado",
        ssl: "Certificado SSL",
        gdpr: "Banner de cookies (RGPD)",
        privacy: "Política de privacidad",
        socialPosts: "Posts sociales/mes",
        leads: "Leads/mes",
        seo: "Optimización SEO",
        googleAds: "Gestión Google Ads",
        chatbots: "Chatbots IA",
        automations: "Automatizaciones",
        aiAgents: "Agentes IA",
        emailSupport: "Soporte email",
        prioritySupport: "Soporte prioritario",
        accountManager: "Account manager dedicado",
        phoneSupport: "Soporte telefónico",
      },
      seoBasic: "Básico",
      seoAdvanced: "Avanzado",
      seoFull: "Suite completa",
      plans: [
        {
          name: "Starter",
          description: "Perfecto para pequeñas empresas que empiezan online.",
          features: [
            "1 sitio web profesional",
            "Certificado SSL",
            "SEO local optimizado",
            "12 posts sociales/mes",
            "Chatbot IA (24/7)",
            "3 automatizaciones",
            "50 leads/mes",
            "Informe mensual",
            "Soporte email",
          ],
        },
        {
          name: "Growth",
          description: "Para empresas en crecimiento que necesitan más potencia.",
          features: [
            "3 sitios web profesionales",
            "Dominio personalizado incluido",
            "SEO avanzado + Google Business",
            "30 posts sociales/mes",
            "2 chatbots IA",
            "10 automatizaciones",
            "200 leads/mes",
            "Informes semanales",
            "Soporte prioritario",
            "Agentes IA activados",
          ],
        },
        {
          name: "Enterprise",
          description: "Marketing digital completo para empresas establecidas.",
          features: [
            "10 sitios web",
            "Múltiples dominios personalizados",
            "Suite SEO completa + Google Ads",
            "90 posts sociales/mes",
            "5 chatbots IA",
            "50 automatizaciones",
            "1000 leads/mes",
            "Informes diarios",
            "Account manager dedicado",
            "Integraciones personalizadas",
          ],
        },
      ],
    },
  },

  fr: {
    meta: {
      title: "MadeCreative — Site web IA en 60 secondes",
      description:
        "MadeCreative crée votre site professionnel en 60 secondes avec l'IA. SEO local, réseaux sociaux, chatbot et leads — entièrement automatisé. À partir de €25/mois.",
    },
    nav: {
      howItWorks: "Comment ça marche",
      demo: "Démo",
      faq: "FAQ",
      startFree: "Commencer gratuitement",
    },
    hero: {
      badge: "Marketing digital propulsé par l'IA",
      title: "Votre site web",
      titleHighlight: "en 60 secondes",
      subtitle:
        "MadeCreative construit votre site professionnel, gère le SEO, les réseaux sociaux et génère des leads — le tout automatisé par l'IA.",
      cta: "Générez votre site gratuitement en 60 secondes",
      ctaSecondary: "Comment ça marche",
      trustNote: "Sans carte bancaire. Annulez quand vous voulez.",
    },
    howItWorks: {
      sectionLabel: "Comment Ça Marche",
      title: "De zéro au site complet en 3 étapes",
      subtitle: "Notre système IA analyse votre entreprise et crée tout automatiquement.",
      steps: [
        {
          number: "01",
          title: "Scraping & Analyse",
          description:
            "Notre agent IA analyse votre présence en ligne existante, votre secteur et vos concurrents. En quelques secondes.",
        },
        {
          number: "02",
          title: "Génération & Preview",
          description:
            "L'IA crée votre site personnalisé avec textes, design et optimisation SEO. Vous voyez un aperçu en temps réel.",
        },
        {
          number: "03",
          title: "Lancement & Automatisation",
          description:
            "En un clic votre site est en ligne. Chatbot, réseaux sociaux et automatisation email démarrent immédiatement.",
        },
      ],
    },
    features: {
      sectionLabel: "Ce Qui Est Inclus",
      title: "Tout ce dont votre entreprise a besoin",
      subtitle: "Une plateforme. Présence digitale complète.",
      items: [
        {
          title: "Site Web Professionnel",
          description:
            "Site généré par IA adapté à votre secteur, déployé en 60 secondes avec SEO intégré.",
        },
        {
          title: "SEO Local",
          description:
            "Meilleur classement dans les recherches locales. Nous optimisons votre profil Google Business.",
        },
        {
          title: "Réseaux Sociaux",
          description:
            "Posts créés par IA pour Instagram et Facebook, planifiés et publiés automatiquement chaque semaine.",
        },
        {
          title: "Chatbot IA",
          description:
            "Chatbot de support 24/7 entraîné sur vos données d'entreprise, intégré dans votre site.",
        },
        {
          title: "Automatisation",
          description:
            "Séquences email, notifications leads, demandes d'avis — tout automatisé.",
        },
        {
          title: "Rapports Mensuels",
          description:
            "Rapports mensuels détaillés sur le trafic, les leads et l'impact sur le chiffre d'affaires.",
        },
      ],
    },
    demo: {
      sectionLabel: "Démo Live",
      title: "Voyez par vous-même",
      subtitle:
        "Entrez les données de votre entreprise et regardez ce que notre IA crée en quelques secondes.",
      namePlaceholder: "ex. Boulangerie Dupont",
      sectorPlaceholder: "ex. Restaurant, Coiffeur, Dentiste...",
      cityPlaceholder: "ex. Paris",
      cta: "Générer l'aperçu du site",
      loading: "L'IA génère votre aperçu...",
      successTitle: "Votre aperçu est prêt!",
      successSubtitle:
        "Notre IA a créé en quelques secondes un site personnalisé pour votre entreprise.",
      successNote: "Commencez maintenant et votre vrai site sera en ligne en 60 secondes.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Questions fréquentes",
      items: [
        {
          q: "Dois-je configurer quoi que ce soit ?",
          a: "Non. Notre système trouve votre entreprise, crée le site et le met en ligne automatiquement. Vous ne faites rien.",
        },
        {
          q: "Puis-je modifier le site ?",
          a: "Oui. Depuis le portail client, vous disposez d'un éditeur en libre-service. Vous modifiez textes, photos, horaires et téléphone. En 2 minutes le site est mis à jour.",
        },
        {
          q: "Comment résilier l'abonnement ?",
          a: "Un clic depuis le portail. Le site passe hors ligne dans les 24 heures. Sans préavis, sans pénalité.",
        },
        {
          q: "Et si le site ne me convient pas ?",
          a: "Remboursement automatique dans les 14 jours suivant la souscription. Pas de ticket, pas d'appel. Un seul clic.",
        },
        {
          q: "Cela fonctionne-t-il pour mon secteur ?",
          a: "Oui : restaurants, dentistes, cabinets juridiques, salles de sport, instituts de beauté, hôtels, boutiques, professionnels.",
        },
      ],
    },
    finalCta: {
      badge: "Prêt à commencer?",
      title: "Votre site est à 60 secondes",
      subtitle:
        "Rejoignez les 127+ entreprises déjà en ligne avec MadeCreative qui acquièrent chaque jour de nouveaux clients.",
      cta: "Commencer gratuitement",
      trustNote: "Sans carte bancaire. Sans contrat. Démarrage immédiat.",
    },
    footer: {
      tagline: "Marketing digital entièrement propulsé par l'IA.",
      copyright: "© 2026 madecreative.pro — Zéro employés. 100% IA.",
      links: {
        privacy: "Politique de Confidentialité",
        cookies: "Politique de Cookies",
        impressum: "Mentions Légales",
        terms: "CGU",
      },
    },
    demoPage: {
      metaTitle: "Démo Live — MadeCreative",
      metaDescription: "Voyez en temps réel comment notre IA crée un site professionnel pour votre entreprise.",
      badge: "Démo Live",
      title: "Voyez l'IA",
      titleHighlight: "en action",
      subtitle: "Entrez les données de votre entreprise et regardez notre IA créer un site professionnel en quelques secondes.",
      labelCompany: "Nom de l'entreprise",
      labelSector: "Secteur",
      labelCity: "Ville",
      labelCountry: "Pays",
      sectorOptions: [
        { value: "ristorazione", label: "Restauration" },
        { value: "dental", label: "Cabinet Dentaire" },
        { value: "legale", label: "Cabinet Juridique" },
        { value: "fitness", label: "Fitness & Sport" },
        { value: "beauty", label: "Beauté & Bien-être" },
        { value: "hotel", label: "Hôtel & Hébergement" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Commerce de Détail" },
        { value: "professional", label: "Services Professionnels" },
      ],
      countryPlaceholder: "ex. France",
      cta: "Générer la preview du site",
      terminalSteps: [
        "Scraping Google Maps...",
        "Analyse des concurrents...",
        "Génération du design system...",
        "Construction du site...",
        "Optimisation des performances...",
      ],
      previewTitle: "Votre preview est prête!",
      previewSubtitle: "Notre IA a créé un site personnalisé en quelques secondes.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Chargement: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Obtenez votre vrai site",
      previewCtaNote: "Sans carte bancaire",
      tryAgain: "Réessayer",
    },
    prezziPage: {
      metaTitle: "Tarifs — MadeCreative",
      metaDescription: "Tarifs transparents sans frais cachés. Starter à partir de €25/mois. Garantie 30 jours.",
      badge: "Tarifs Transparents",
      title: "Tarifs",
      subtitle: "Frais de setup unique + abonnement mensuel. Annulez quand vous voulez.",
      monthly: "Mensuel",
      annual: "Annuel",
      annualDiscount: "-20%",
      perMonth: "/mois",
      setupFee: "Frais de setup unique",
      mostPopular: "Plus populaire",
      getStarted: "Commencer maintenant",
      moneyBack: "Garantie remboursement 30 jours",
      moneyBackTitle: "Garantie remboursement 30 jours",
      moneyBackDesc: "Pas satisfait dans les 30 premiers jours? Nous remboursons les frais de setup et le premier mois. Sans questions.",
      savingsLabel: "Vous économisez €{n}/an",
      billedAnnually: "Facturé annuellement €{n}/an",
      compareTitle: "Comparaison complète des fonctionnalités",
      faqTitle: "Questions fréquentes",
      tableCategories: {
        website: "Site Web",
        marketing: "Marketing",
        ai: "IA & Automatisation",
        support: "Support",
      },
      tableFeatures: {
        websites: "Sites web inclus",
        customDomain: "Domaine personnalisé",
        ssl: "Certificat SSL",
        gdpr: "Bannière cookies (RGPD)",
        privacy: "Politique de confidentialité",
        socialPosts: "Posts sociaux/mois",
        leads: "Leads/mois",
        seo: "Optimisation SEO",
        googleAds: "Gestion Google Ads",
        chatbots: "Chatbots IA",
        automations: "Automatisations",
        aiAgents: "Agents IA",
        emailSupport: "Support email",
        prioritySupport: "Support prioritaire",
        accountManager: "Account manager dédié",
        phoneSupport: "Support téléphonique",
      },
      seoBasic: "Basique",
      seoAdvanced: "Avancé",
      seoFull: "Suite complète",
      plans: [
        {
          name: "Starter",
          description: "Parfait pour les petites entreprises qui démarrent en ligne.",
          features: [
            "1 site web professionnel",
            "Certificat SSL",
            "SEO local optimisé",
            "12 posts sociaux/mois",
            "Chatbot IA (24/7)",
            "3 automatisations",
            "50 leads/mois",
            "Rapport mensuel",
            "Support email",
          ],
        },
        {
          name: "Growth",
          description: "Pour les entreprises en croissance qui ont besoin de plus de puissance.",
          features: [
            "3 sites web professionnels",
            "Domaine personnalisé inclus",
            "SEO avancé + Google Business",
            "30 posts sociaux/mois",
            "2 chatbots IA",
            "10 automatisations",
            "200 leads/mois",
            "Rapports hebdomadaires",
            "Support prioritaire",
            "Agents IA activés",
          ],
        },
        {
          name: "Enterprise",
          description: "Marketing digital full-service pour les entreprises établies.",
          features: [
            "10 sites web",
            "Plusieurs domaines personnalisés",
            "Suite SEO complète + Google Ads",
            "90 posts sociaux/mois",
            "5 chatbots IA",
            "50 automatisations",
            "1000 leads/mois",
            "Rapports quotidiens",
            "Account manager dédié",
            "Intégrations personnalisées",
          ],
        },
      ],
    },
  },

  nl: {
    meta: {
      title: "MadeCreative — AI-website in 60 seconden",
      description:
        "MadeCreative maakt uw professionele website in 60 seconden met AI. Lokale SEO, social media, chatbot en leads — volledig geautomatiseerd. Vanaf €25/maand.",
    },
    nav: {
      howItWorks: "Hoe het werkt",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Gratis starten",
    },
    hero: {
      badge: "AI-aangedreven digitale marketing",
      title: "Uw website",
      titleHighlight: "in 60 seconden",
      subtitle:
        "MadeCreative bouwt uw professionele website, beheert SEO, social media en genereert leads — alles geautomatiseerd door AI.",
      cta: "Genereer uw website gratis in 60 seconden",
      ctaSecondary: "Hoe het werkt",
      trustNote: "Geen creditcard nodig. Op elk moment opzegbaar.",
    },
    howItWorks: {
      sectionLabel: "Hoe Het Werkt",
      title: "Van nul naar complete website in 3 stappen",
      subtitle: "Ons AI-systeem analyseert uw bedrijf en maakt alles automatisch.",
      steps: [
        {
          number: "01",
          title: "Scraping & Analyse",
          description:
            "Onze AI-agent analyseert uw bestaande online aanwezigheid, sector en concurrenten. In seconden.",
        },
        {
          number: "02",
          title: "Generatie & Preview",
          description:
            "De AI maakt uw op maat gemaakte website met teksten, design en SEO-optimalisatie. U ziet een live preview.",
        },
        {
          number: "03",
          title: "Launch & Automatisering",
          description:
            "Met één klik gaat uw website live. Chatbot, social media en e-mailautomatisering starten direct.",
        },
      ],
    },
    features: {
      sectionLabel: "Wat Is Inbegrepen",
      title: "Alles wat uw bedrijf nodig heeft",
      subtitle: "Eén platform. Volledige digitale aanwezigheid.",
      items: [
        {
          title: "Professionele Website",
          description:
            "AI-gegenereerde website op maat voor uw sector, in 60 seconden gedeployed met ingebouwde SEO.",
        },
        {
          title: "Lokale SEO",
          description:
            "Hogere rankings in lokale zoekopdrachten. We optimaliseren uw Google Business-profiel.",
        },
        {
          title: "Social Media",
          description:
            "AI-gemaakte posts voor Instagram en Facebook, automatisch gepland en wekelijks gepubliceerd.",
        },
        {
          title: "AI-Chatbot",
          description:
            "24/7 klantenservice-chatbot getraind op uw bedrijfsgegevens, ingebed op uw website.",
        },
        {
          title: "Automatisering",
          description:
            "E-mailsequenties, leadmeldingen, beoordelingsverzoeken — alles geautomatiseerd.",
        },
        {
          title: "Maandelijkse Rapporten",
          description:
            "Gedetailleerde maandelijkse prestatieraporten over websiteverkeer, leads en omzetimpact.",
        },
      ],
    },
    demo: {
      sectionLabel: "Live Demo",
      title: "Zie het zelf",
      subtitle:
        "Voer de gegevens van uw bedrijf in en zie wat onze AI in seconden maakt.",
      namePlaceholder: "bijv. Bakkerij De Smid",
      sectorPlaceholder: "bijv. Restaurant, Kapper, Tandarts...",
      cityPlaceholder: "bijv. Amsterdam",
      cta: "Website-preview genereren",
      loading: "AI genereert uw preview...",
      successTitle: "Uw preview is klaar!",
      successSubtitle:
        "Onze AI heeft in seconden een op maat gemaakte website voor uw bedrijf gemaakt.",
      successNote: "Start nu en uw echte website is in 60 seconden live.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Veelgestelde vragen",
      items: [
        {
          q: "Moet ik iets configureren?",
          a: "Nee. Ons systeem vindt uw bedrijf, maakt de website en zet deze automatisch online. U hoeft niets te doen.",
        },
        {
          q: "Kan ik de website bewerken?",
          a: "Ja. Via het klantportal heeft u een self-service editor. U wijzigt teksten, foto's, openingstijden en telefoonnummer. In 2 minuten is de website bijgewerkt.",
        },
        {
          q: "Hoe zeg ik het abonnement op?",
          a: "Eén klik vanuit het portal. De website gaat binnen 24 uur offline. Geen opzegtermijn, geen boete.",
        },
        {
          q: "En als de website me niet bevalt?",
          a: "Automatische terugbetaling binnen 14 dagen na inschrijving. Geen ticket, geen telefoontje. Gewoon één klik.",
        },
        {
          q: "Werkt het voor mijn sector?",
          a: "Ja: restaurants, tandartsen, advocatenkantoren, sportscholen, schoonheidssalons, hotels, winkels, zelfstandigen.",
        },
      ],
    },
    finalCta: {
      badge: "Klaar om te beginnen?",
      title: "Uw website is 60 seconden weg",
      subtitle:
        "Sluit u aan bij de 127+ bedrijven die al online zijn met MadeCreative en elke dag nieuwe klanten winnen.",
      cta: "Nu gratis beginnen",
      trustNote: "Geen creditcard. Geen contract. Direct starten.",
    },
    footer: {
      tagline: "Digitale marketing volledig aangedreven door AI.",
      copyright: "© 2026 madecreative.pro — Nul medewerkers. 100% AI.",
      links: {
        privacy: "Privacybeleid",
        cookies: "Cookiebeleid",
        impressum: "Impressum",
        terms: "Voorwaarden",
      },
    },
    demoPage: {
      metaTitle: "Live Demo — MadeCreative",
      metaDescription: "Zie in realtime hoe onze AI een professionele website maakt voor uw bedrijf.",
      badge: "Live Demo",
      title: "Zie de AI",
      titleHighlight: "in actie",
      subtitle: "Voer uw bedrijfsgegevens in en zie hoe onze AI in seconden een professionele website maakt.",
      labelCompany: "Bedrijfsnaam",
      labelSector: "Sector",
      labelCity: "Stad",
      labelCountry: "Land",
      sectorOptions: [
        { value: "ristorazione", label: "Restaurant & Horeca" },
        { value: "dental", label: "Tandartspraktijk" },
        { value: "legale", label: "Advocatenkantoor" },
        { value: "fitness", label: "Fitness & Sport" },
        { value: "beauty", label: "Beauty & Wellness" },
        { value: "hotel", label: "Hotel & Verblijf" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Detailhandel" },
        { value: "professional", label: "Professionele Diensten" },
      ],
      countryPlaceholder: "bijv. Nederland",
      cta: "Website preview genereren",
      terminalSteps: [
        "Google Maps scrapen...",
        "Concurrenten analyseren...",
        "Design systeem genereren...",
        "Website bouwen...",
        "Prestaties optimaliseren...",
      ],
      previewTitle: "Uw preview is klaar!",
      previewSubtitle: "Onze AI heeft in seconden een gepersonaliseerde website gemaakt.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Laadtijd: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Krijg uw echte website",
      previewCtaNote: "Geen creditcard vereist",
      tryAgain: "Opnieuw proberen",
    },
    prezziPage: {
      metaTitle: "Prijzen — MadeCreative",
      metaDescription: "Transparante prijzen zonder verborgen kosten. Starter vanaf €25/maand. 30 dagen geld-terug-garantie.",
      badge: "Transparante Prijzen",
      title: "Prijzen",
      subtitle: "Eenmalige setup + maandelijks abonnement. Op elk moment opzegbaar.",
      monthly: "Maandelijks",
      annual: "Jaarlijks",
      annualDiscount: "-20%",
      perMonth: "/maand",
      setupFee: "Eenmalige setup",
      mostPopular: "Meest populair",
      getStarted: "Nu beginnen",
      moneyBack: "30 dagen geld-terug-garantie",
      moneyBackTitle: "30 dagen geld-terug-garantie",
      moneyBackDesc: "Niet tevreden in de eerste 30 dagen? We vergoeden zowel de setup als de eerste maand. Zonder vragen.",
      savingsLabel: "U bespaart €{n}/jaar",
      billedAnnually: "Jaarlijks gefactureerd €{n}/jaar",
      compareTitle: "Volledige functievergelijking",
      faqTitle: "Veelgestelde vragen",
      tableCategories: {
        website: "Website",
        marketing: "Marketing",
        ai: "AI & Automatisering",
        support: "Support",
      },
      tableFeatures: {
        websites: "Inbegrepen websites",
        customDomain: "Eigen domein",
        ssl: "SSL-certificaat",
        gdpr: "Cookiebanner (AVG)",
        privacy: "Privacybeleid",
        socialPosts: "Social posts/maand",
        leads: "Leads/maand",
        seo: "SEO-optimalisatie",
        googleAds: "Google Ads beheer",
        chatbots: "AI-chatbots",
        automations: "Automatiseringen",
        aiAgents: "AI-agenten",
        emailSupport: "E-mailondersteuning",
        prioritySupport: "Prioriteitsondersteuning",
        accountManager: "Dedicated accountmanager",
        phoneSupport: "Telefonische ondersteuning",
      },
      seoBasic: "Basis",
      seoAdvanced: "Geavanceerd",
      seoFull: "Volledige suite",
      plans: [
        {
          name: "Starter",
          description: "Perfect voor kleine bedrijven die online starten.",
          features: [
            "1 professionele website",
            "SSL-certificaat",
            "Lokale SEO-optimalisatie",
            "12 social posts/maand",
            "AI-chatbot (24/7)",
            "3 automatiseringen",
            "50 leads/maand",
            "Maandrapport",
            "E-mailondersteuning",
          ],
        },
        {
          name: "Growth",
          description: "Voor groeiende bedrijven met meer kracht en bereik.",
          features: [
            "3 professionele websites",
            "Eigen domein inbegrepen",
            "Geavanceerde SEO + Google Business",
            "30 social posts/maand",
            "2 AI-chatbots",
            "10 automatiseringen",
            "200 leads/maand",
            "Wekelijkse rapporten",
            "Prioriteitsondersteuning",
            "AI-agenten geactiveerd",
          ],
        },
        {
          name: "Enterprise",
          description: "Full-service digitale marketing voor gevestigde bedrijven.",
          features: [
            "10 websites",
            "Meerdere eigen domeinen",
            "Volledige SEO-suite + Google Ads",
            "90 social posts/maand",
            "5 AI-chatbots",
            "50 automatiseringen",
            "1000 leads/maand",
            "Dagelijkse rapporten",
            "Dedicated accountmanager",
            "Aangepaste integraties",
          ],
        },
      ],
    },
  },

  pt: {
    meta: {
      title: "MadeCreative — Site web com IA em 60 segundos",
      description:
        "MadeCreative cria o seu site profissional em 60 segundos com IA. SEO local, redes sociais, chatbot e leads — completamente automatizado. A partir de €25/mês.",
    },
    nav: {
      howItWorks: "Como funciona",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Começar grátis",
    },
    hero: {
      badge: "Marketing digital impulsionado por IA",
      title: "O seu site web",
      titleHighlight: "em 60 segundos",
      subtitle:
        "MadeCreative constrói o seu site profissional, gere o SEO, as redes sociais e gera leads — tudo automatizado pela IA.",
      cta: "Gere o seu site grátis em 60 segundos",
      ctaSecondary: "Como funciona",
      trustNote: "Sem cartão de crédito. Cancele quando quiser.",
    },
    howItWorks: {
      sectionLabel: "Como Funciona",
      title: "Do zero ao site completo em 3 passos",
      subtitle: "O nosso sistema de IA analisa a sua empresa e cria tudo automaticamente.",
      steps: [
        {
          number: "01",
          title: "Scraping & Análise",
          description:
            "O nosso agente de IA analisa a sua presença online existente, setor e concorrentes. Em segundos.",
        },
        {
          number: "02",
          title: "Geração & Preview",
          description:
            "A IA cria o seu site personalizado com textos, design e otimização SEO. Vê uma pré-visualização em tempo real.",
        },
        {
          number: "03",
          title: "Lançamento & Automação",
          description:
            "Com um clique o seu site fica online. Chatbot, redes sociais e automação de email arrancam imediatamente.",
        },
      ],
    },
    features: {
      sectionLabel: "O Que Está Incluído",
      title: "Tudo o que a sua empresa precisa",
      subtitle: "Uma plataforma. Presença digital completa.",
      items: [
        {
          title: "Site Web Profissional",
          description:
            "Site gerado por IA adaptado ao seu setor, deployed em 60 segundos com SEO integrado.",
        },
        {
          title: "SEO Local",
          description:
            "Melhor posicionamento nas pesquisas locais. Otimizamos o seu perfil Google Business.",
        },
        {
          title: "Redes Sociais",
          description:
            "Posts criados por IA para Instagram e Facebook, agendados e publicados automaticamente cada semana.",
        },
        {
          title: "Chatbot IA",
          description:
            "Chatbot de suporte 24/7 treinado nos dados da sua empresa, integrado no seu site.",
        },
        {
          title: "Automação",
          description:
            "Sequências de email, notificações de leads, pedidos de avaliação — tudo automatizado.",
        },
        {
          title: "Relatórios Mensais",
          description:
            "Relatórios mensais detalhados sobre tráfego, leads e impacto na faturação.",
        },
      ],
    },
    demo: {
      sectionLabel: "Demo ao Vivo",
      title: "Veja por si mesmo",
      subtitle:
        "Introduza os dados da sua empresa e veja o que a nossa IA cria em segundos.",
      namePlaceholder: "ex. Pastelaria Rodrigues",
      sectorPlaceholder: "ex. Restaurante, Cabeleireiro, Dentista...",
      cityPlaceholder: "ex. Lisboa",
      cta: "Gerar preview do site",
      loading: "A IA está a gerar a sua preview...",
      successTitle: "A sua preview está pronta!",
      successSubtitle:
        "A nossa IA criou em segundos um site personalizado para a sua empresa.",
      successNote: "Comece agora e o seu site real ficará online em 60 segundos.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Perguntas frequentes",
      items: [
        {
          q: "Preciso de configurar alguma coisa?",
          a: "Não. O nosso sistema encontra o seu negócio, cria o site e coloca-o online automaticamente. Não toca em nada.",
        },
        {
          q: "Posso editar o site?",
          a: "Sim. No portal do cliente tem um editor self-service. Altera textos, fotos, horários e telefone. Em 2 minutos o site é atualizado.",
        },
        {
          q: "Como cancelo a subscrição?",
          a: "Um clique no portal. O site fica offline em 24 horas. Sem aviso prévio, sem penalização.",
        },
        {
          q: "E se o site não me agradar?",
          a: "Reembolso automático em 14 dias após a subscrição. Sem ticket, sem chamada. Apenas um clique.",
        },
        {
          q: "Funciona para o meu setor?",
          a: "Sim: restaurantes, dentistas, escritórios jurídicos, ginásios, centros de estética, hotéis, lojas, profissionais.",
        },
      ],
    },
    finalCta: {
      badge: "Pronto para começar?",
      title: "O seu site está a 60 segundos",
      subtitle:
        "Junte-se às 127+ empresas já online com MadeCreative que ganham novos clientes todos os dias.",
      cta: "Começar grátis agora",
      trustNote: "Sem cartão de crédito. Sem contrato. Início imediato.",
    },
    footer: {
      tagline: "Marketing digital completamente impulsionado por IA.",
      copyright: "© 2026 madecreative.pro — Zero funcionários. 100% IA.",
      links: {
        privacy: "Política de Privacidade",
        cookies: "Política de Cookies",
        impressum: "Impressum",
        terms: "Termos",
      },
    },
    demoPage: {
      metaTitle: "Demo Ao Vivo — MadeCreative",
      metaDescription: "Veja em tempo real como a nossa IA cria um site profissional para a sua empresa.",
      badge: "Demo Ao Vivo",
      title: "Veja a IA",
      titleHighlight: "em ação",
      subtitle: "Insira os dados da sua empresa e veja como a nossa IA cria um site profissional em segundos.",
      labelCompany: "Nome da empresa",
      labelSector: "Setor",
      labelCity: "Cidade",
      labelCountry: "País",
      sectorOptions: [
        { value: "ristorazione", label: "Restauração" },
        { value: "dental", label: "Clínica Dentária" },
        { value: "legale", label: "Escritório Jurídico" },
        { value: "fitness", label: "Fitness & Desporto" },
        { value: "beauty", label: "Beauty & Bem-estar" },
        { value: "hotel", label: "Hotel & Alojamento" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Comércio a Retalho" },
        { value: "professional", label: "Serviços Profissionais" },
      ],
      countryPlaceholder: "ex. Portugal",
      cta: "Gerar preview do site",
      terminalSteps: [
        "A fazer scraping do Google Maps...",
        "A analisar concorrentes...",
        "A gerar sistema de design...",
        "A construir o site...",
        "A otimizar performance...",
      ],
      previewTitle: "A sua preview está pronta!",
      previewSubtitle: "A nossa IA criou um site personalizado em segundos.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Carregamento: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Obtenha o seu site real",
      previewCtaNote: "Sem cartão de crédito",
      tryAgain: "Tentar novamente",
    },
    prezziPage: {
      metaTitle: "Preços — MadeCreative",
      metaDescription: "Preços transparentes sem custos ocultos. Starter a partir de €25/mês. Garantia 30 dias.",
      badge: "Preços Transparentes",
      title: "Preços",
      subtitle: "Custo de setup único + subscrição mensal. Cancele quando quiser.",
      monthly: "Mensal",
      annual: "Anual",
      annualDiscount: "-20%",
      perMonth: "/mês",
      setupFee: "Custo de setup único",
      mostPopular: "Mais popular",
      getStarted: "Começar agora",
      moneyBack: "Garantia de reembolso 30 dias",
      moneyBackTitle: "Garantia de reembolso 30 dias",
      moneyBackDesc: "Não satisfeito nos primeiros 30 dias? Reembolsamos o setup e o primeiro mês. Sem perguntas.",
      savingsLabel: "Poupa €{n}/ano",
      billedAnnually: "Faturado anualmente €{n}/ano",
      compareTitle: "Comparação completa de funcionalidades",
      faqTitle: "Perguntas frequentes",
      tableCategories: {
        website: "Site Web",
        marketing: "Marketing",
        ai: "IA & Automação",
        support: "Suporte",
      },
      tableFeatures: {
        websites: "Sites web incluídos",
        customDomain: "Domínio personalizado",
        ssl: "Certificado SSL",
        gdpr: "Banner de cookies (RGPD)",
        privacy: "Política de privacidade",
        socialPosts: "Posts sociais/mês",
        leads: "Leads/mês",
        seo: "Otimização SEO",
        googleAds: "Gestão Google Ads",
        chatbots: "Chatbots IA",
        automations: "Automatizações",
        aiAgents: "Agentes IA",
        emailSupport: "Suporte email",
        prioritySupport: "Suporte prioritário",
        accountManager: "Account manager dedicado",
        phoneSupport: "Suporte telefónico",
      },
      seoBasic: "Básico",
      seoAdvanced: "Avançado",
      seoFull: "Suite completa",
      plans: [
        {
          name: "Starter",
          description: "Perfeito para pequenas empresas que começam online.",
          features: [
            "1 site web profissional",
            "Certificado SSL",
            "SEO local otimizado",
            "12 posts sociais/mês",
            "Chatbot IA (24/7)",
            "3 automações",
            "50 leads/mês",
            "Relatório mensal",
            "Suporte email",
          ],
        },
        {
          name: "Growth",
          description: "Para empresas em crescimento que precisam de mais potência.",
          features: [
            "3 sites web profissionais",
            "Domínio personalizado incluído",
            "SEO avançado + Google Business",
            "30 posts sociais/mês",
            "2 chatbots IA",
            "10 automações",
            "200 leads/mês",
            "Relatórios semanais",
            "Suporte prioritário",
            "Agentes IA ativados",
          ],
        },
        {
          name: "Enterprise",
          description: "Marketing digital full-service para empresas estabelecidas.",
          features: [
            "10 sites web",
            "Vários domínios personalizados",
            "Suite SEO completa + Google Ads",
            "90 posts sociais/mês",
            "5 chatbots IA",
            "50 automações",
            "1000 leads/mês",
            "Relatórios diários",
            "Account manager dedicado",
            "Integrações personalizadas",
          ],
        },
      ],
    },
  },

  en: {
    meta: {
      title: "MadeCreative — AI-powered website in 60 seconds",
      description:
        "MadeCreative creates your professional website in 60 seconds with AI. Local SEO, social media, chatbot and leads — fully automated. From €25/month.",
    },
    nav: {
      howItWorks: "How it works",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Start free",
    },
    hero: {
      badge: "AI-powered digital marketing",
      title: "Your website",
      titleHighlight: "in 60 seconds",
      subtitle:
        "MadeCreative builds your professional website, manages SEO, social media and generates leads — all automated by AI.",
      cta: "Generate your website free in 60 seconds",
      ctaSecondary: "How it works",
      trustNote: "No credit card required. Cancel anytime.",
    },
    howItWorks: {
      sectionLabel: "How It Works",
      title: "From zero to complete website in 3 steps",
      subtitle: "Our AI system analyzes your business and creates everything automatically.",
      steps: [
        {
          number: "01",
          title: "Scraping & Analysis",
          description:
            "Our AI agent analyzes your existing online presence, sector and competitors. In seconds.",
        },
        {
          number: "02",
          title: "Generation & Preview",
          description:
            "The AI creates your tailored website with copy, design and SEO optimization. You see a live preview.",
        },
        {
          number: "03",
          title: "Launch & Automation",
          description:
            "With one click your website goes live. Chatbot, social media and email automation start immediately.",
        },
      ],
    },
    features: {
      sectionLabel: "What's Included",
      title: "Everything your business needs",
      subtitle: "One platform. Complete digital presence.",
      items: [
        {
          title: "Professional Website",
          description:
            "AI-generated website tailored to your sector, deployed in 60 seconds with built-in SEO.",
        },
        {
          title: "Local SEO",
          description:
            "Higher rankings in local searches. We optimize your Google Business Profile.",
        },
        {
          title: "Social Media",
          description:
            "AI-created posts for Instagram and Facebook, scheduled and published automatically every week.",
        },
        {
          title: "AI Chatbot",
          description:
            "24/7 customer support chatbot trained on your business data, embedded on your website.",
        },
        {
          title: "Automation",
          description:
            "Email sequences, lead notifications, review requests — all automated.",
        },
        {
          title: "Monthly Reports",
          description:
            "Detailed monthly performance reports on website traffic, leads and revenue impact.",
        },
      ],
    },
    demo: {
      sectionLabel: "Live Demo",
      title: "See it for yourself",
      subtitle:
        "Enter your business details and watch what our AI creates in seconds.",
      namePlaceholder: "e.g. Smith's Bakery",
      sectorPlaceholder: "e.g. Restaurant, Hair Salon, Dentist...",
      cityPlaceholder: "e.g. London",
      cta: "Generate website preview",
      loading: "AI is generating your preview...",
      successTitle: "Your preview is ready!",
      successSubtitle: "Our AI has created a tailored website for your business in seconds.",
      successNote: "Start now and your real website will be live in 60 seconds.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Frequently asked questions",
      items: [
        {
          q: "Do I need to configure anything?",
          a: "No. Our system finds your business, builds the website and publishes it online automatically. You do not touch a thing.",
        },
        {
          q: "Can I edit the website?",
          a: "Yes. From the client portal you have a self-service editor. Change texts, photos, opening hours and phone number. The site updates in 2 minutes.",
        },
        {
          q: "How do I cancel my subscription?",
          a: "One click from the portal. The site goes offline within 24 hours. No notice period, no penalty.",
        },
        {
          q: "What if I don't like the website?",
          a: "Automatic refund within 14 days of subscribing. No ticket, no phone call. Just one click.",
        },
        {
          q: "Does it work for my industry?",
          a: "Yes: restaurants, dentists, law firms, gyms, beauty salons, hotels, retail shops, professionals.",
        },
      ],
    },
    finalCta: {
      badge: "Ready to get started?",
      title: "Your website is 60 seconds away",
      subtitle:
        "Join the 127+ businesses already online with MadeCreative winning new customers every day.",
      cta: "Start free now",
      trustNote: "No credit card. No contract. Instant start.",
    },
    footer: {
      tagline: "Digital marketing fully powered by AI.",
      copyright: "© 2026 madecreative.pro — Zero employees. 100% AI.",
      links: {
        privacy: "Privacy Policy",
        cookies: "Cookie Policy",
        impressum: "Impressum",
        terms: "Terms",
      },
    },
    demoPage: {
      metaTitle: "Live Demo — MadeCreative",
      metaDescription: "See in real-time how our AI creates a professional website for your business.",
      badge: "Live Demo",
      title: "See the AI",
      titleHighlight: "in action",
      subtitle: "Enter your business details and watch our AI create a professional website in seconds.",
      labelCompany: "Company name",
      labelSector: "Sector",
      labelCity: "City",
      labelCountry: "Country",
      sectorOptions: [
        { value: "ristorazione", label: "Restaurant & Food" },
        { value: "dental", label: "Dental Practice" },
        { value: "legale", label: "Law Firm" },
        { value: "fitness", label: "Fitness & Sport" },
        { value: "beauty", label: "Beauty & Wellness" },
        { value: "hotel", label: "Hotel & Accommodation" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Retail & Shops" },
        { value: "professional", label: "Professional Services" },
      ],
      countryPlaceholder: "e.g. United Kingdom",
      cta: "Generate website preview",
      terminalSteps: [
        "Scraping Google Maps...",
        "Analysing competitors...",
        "Generating design system...",
        "Building the website...",
        "Optimising performance...",
      ],
      previewTitle: "Your preview is ready!",
      previewSubtitle: "Our AI has built a custom website for your business in seconds.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Load time: 1.2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Get your real website",
      previewCtaNote: "No credit card required",
      tryAgain: "Try again",
    },
    prezziPage: {
      metaTitle: "Pricing — MadeCreative",
      metaDescription: "Transparent pricing with no hidden fees. Starter from €25/month. 30-day money-back guarantee.",
      badge: "Transparent Pricing",
      title: "Pricing",
      subtitle: "One-time setup fee + monthly subscription. Cancel anytime.",
      monthly: "Monthly",
      annual: "Annual",
      annualDiscount: "-20%",
      perMonth: "/month",
      setupFee: "One-time setup fee",
      mostPopular: "Most popular",
      getStarted: "Get started",
      moneyBack: "30-day money-back guarantee",
      moneyBackTitle: "30-day money-back guarantee",
      moneyBackDesc: "Not satisfied in the first 30 days? We refund both the setup fee and the first month. No questions asked.",
      savingsLabel: "You save €{n}/year",
      billedAnnually: "Billed annually €{n}/year",
      compareTitle: "Full feature comparison",
      faqTitle: "Frequently asked questions",
      tableCategories: {
        website: "Website",
        marketing: "Marketing",
        ai: "AI & Automation",
        support: "Support",
      },
      tableFeatures: {
        websites: "Websites included",
        customDomain: "Custom domain",
        ssl: "SSL certificate",
        gdpr: "Cookie banner (GDPR)",
        privacy: "Privacy policy",
        socialPosts: "Social posts/month",
        leads: "Leads/month",
        seo: "SEO optimisation",
        googleAds: "Google Ads management",
        chatbots: "AI chatbots",
        automations: "Automations",
        aiAgents: "AI agents",
        emailSupport: "Email support",
        prioritySupport: "Priority support",
        accountManager: "Dedicated account manager",
        phoneSupport: "Phone support",
      },
      seoBasic: "Basic",
      seoAdvanced: "Advanced",
      seoFull: "Full suite",
      plans: [
        {
          name: "Starter",
          description: "Perfect for small businesses getting started online.",
          features: [
            "1 professional website",
            "SSL certificate",
            "Local SEO optimisation",
            "12 social posts/month",
            "AI chatbot (24/7)",
            "3 automations",
            "50 leads/month",
            "Monthly report",
            "Email support",
          ],
        },
        {
          name: "Growth",
          description: "For growing businesses that need more power and reach.",
          features: [
            "3 professional websites",
            "Custom domain included",
            "Advanced SEO + Google Business",
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
          name: "Enterprise",
          description: "Full-service digital marketing for established businesses.",
          features: [
            "10 websites",
            "Multiple custom domains",
            "Full SEO suite + Google Ads",
            "90 social posts/month",
            "5 AI chatbots",
            "50 automations",
            "1000 leads/month",
            "Daily reports",
            "Dedicated account manager",
            "Custom integrations",
          ],
        },
      ],
    },
  },
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}
