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
    urlPlaceholder: string;
    urlCta: string;
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
    worksForAnyIndustry: string;
    responsiveOnEveryDevice: string;
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
  useCases: {
    sectionLabel: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    ctaNote: string;
    ctaLink: string;
    items: Array<{ name: string; tagline: string; description: string; stats: string }>;
  };
  comparison: {
    sectionLabel: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    headers: { feature: string; madecreative: string; wix: string; wordpress: string; custom: string };
    best: string;
    partial: string;
    footnote: string;
    features: Array<{ name: string }>;
    highlights: Array<{ title: string }>;
  };
  testimonials: {
    sectionLabel: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    items: Array<{ name: string; role: string; location: string; quote: string; result: string }>;
    stats: Array<{ value: string; label: string }>;
    trust: Array<{ icon: string; text: string }>;
  };
}

export const translations: Record<Locale, Translations> = {
  de: {
    meta: {
      title: "MadeCreative — KI-Website-Builder wie Lovable",
      description:
        "Beschreibe deine Website im Chat — die KI schreibt echten React & Tailwind-Code und zeigt dir eine Live-Preview. Keine Coding-Kenntnisse nötig. Ab €25/Monat.",
    },
    nav: {
      howItWorks: "So funktioniert's",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Kostenlos starten",
    },
    hero: {
      badge: "KI-gestützter Website-Builder",
      title: "Beschreib es.",
      titleHighlight: "KI baut es.",
      subtitle:
        "Sag unserer KI, was du willst. Sie schreibt echten React & Tailwind-Code, zeigt dir eine Live-Preview und deployt in Sekunden. Kein Coding nötig.",
      cta: "Kostenlos starten",
      ctaSecondary: "Sieh es in Aktion",
      trustNote: "Keine Kreditkarte erforderlich · Kostenloser Plan verfügbar",
      urlPlaceholder: "Gib deine Website-URL für eine kostenlose Analyse ein",
      urlCta: "Analysieren",
    },
    howItWorks: {
      sectionLabel: "So funktioniert's",
      title: "So funktioniert MadeCreative",
      subtitle: "Drei Schritte. Kein Code. Unendliche Möglichkeiten.",
      steps: [
        {
          number: "01",
          title: "Beschreiben",
          description:
            "Sag der KI, was du willst — eine Restaurant-Website, einen Online-Shop, ein Portfolio. So detailliert oder vage du willst.",
        },
        {
          number: "02",
          title: "Beim Bauen zusehen",
          description:
            "Unsere KI schreibt echten Next.js + Tailwind-Code in Echtzeit. Du siehst jede erstellte Datei, jede gebaute Komponente — live.",
        },
        {
          number: "03",
          title: "Deployen & Bearbeiten",
          description:
            "Deine Website geht sofort auf deiner eigenen Domain live. Chatte weiter, um Änderungen vorzunehmen — die KI bearbeitet jeden Bereich in Sekunden.",
        },
      ],
    },
    features: {
      sectionLabel: "Was enthalten ist",
      title: "Alles, was du brauchst",
      subtitle: "Eine KI. Echter Code. Unendliche Websites.",
      worksForAnyIndustry: "Für jede Branche geeignet",
      responsiveOnEveryDevice: "Responsiv auf jedem Gerät",
      items: [
        {
          title: "KI-Code-Generierung",
          description:
            "Echter React & Tailwind-Code, keine Templates. Jede Website ist einzigartig, von der KI maßgefertigt.",
        },
        {
          title: "Live-Preview",
          description:
            "Sieh Änderungen in Echtzeit, während die KI Code schreibt. Wie Pair Programming mit einem Senior-Entwickler.",
        },
        {
          title: "Jede Art von Website",
          description:
            "Landing Pages, E-Commerce, Portfolios, Blogs, Dashboards — beschreib es und die KI baut es.",
        },
        {
          title: "Integriertes SEO",
          description:
            "Schema.org, Open Graph, Meta-Tags, Sitemap — alles wird automatisch generiert.",
        },
        {
          title: "KI-Chat-Editor",
          description:
            "Beschreibe Änderungen in normaler Sprache. Die KI versteht den Kontext und bearbeitet präzise.",
        },
        {
          title: "Sofortiges Deployen",
          description:
            "Ein Klick zum Go-live. Eigene Domain, SSL, CDN — alles inklusive.",
        },
      ],
    },
    demo: {
      sectionLabel: "Live Demo",
      title: "Sieh es in Aktion",
      subtitle: "Gib einen Firmennamen ein und schau, wie die KI in Sekunden eine komplette Website baut",
      namePlaceholder: "z.B. Bäckerei Schmidt",
      sectorPlaceholder: "z.B. Restaurant, Friseur, Zahnarzt...",
      cityPlaceholder: "z.B. München",
      cta: "Meine Website generieren",
      loading: "KI baut gerade...",
      successTitle: "Deine Website ist fertig!",
      successSubtitle:
        "Die KI hat in Sekunden eine vollständige Website mit echtem React & Tailwind-Code erstellt.",
      successNote: "Starte jetzt kostenlos — keine Kreditkarte erforderlich.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Häufig gestellte Fragen",
      items: [
        {
          q: "Brauche ich Coding-Kenntnisse?",
          a: "Überhaupt nicht. Beschreibe einfach, was du willst, in normaler Sprache — Deutsch, Englisch, Italienisch, egal welche Sprache. Die KI kümmert sich um den ganzen Code.",
        },
        {
          q: "Welche Arten von Websites kann ich bauen?",
          a: "Alles: Landing Pages, mehrseitige Websites, Online-Shops, Portfolios, Blogs, Buchungssysteme, Dashboards. Die KI schreibt echten React-Code — es gibt keine Grenzen.",
        },
        {
          q: "Kann ich meine Website nach dem Bauen bearbeiten?",
          a: "Ja! Chatte einfach mit der KI: 'Ändere die Hero-Farbe zu Blau', 'Füge einen Preisbereich hinzu', 'Mache die Galerie größer'. Sie bearbeitet den Code in Echtzeit.",
        },
        {
          q: "Was ist der Unterschied zu Wix oder WordPress?",
          a: "MadeCreative generiert echten Next.js-Code — keine Drag-and-Drop-Blöcke. Deine Website ist schneller, flexibler anpassbar und wirklich einzigartig.",
        },
        {
          q: "Was ist mit SEO?",
          a: "Jede Website bekommt Schema.org-Markup, Open Graph-Tags, optimierte Meta-Beschreibungen, semantisches HTML und eine Sitemap — alles automatisch.",
        },
        {
          q: "Kann ich meine eigene Domain verwenden?",
          a: "Ja. Verbinde jede Domain mit einem Klick. SSL-Zertifikat kostenlos inklusive.",
        },
        {
          q: "Was, wenn mir das Ergebnis nicht gefällt?",
          a: "Chatte einfach weiter! Sag der KI, was sie ändern soll. Oder gehe mit einem Klick zu einer früheren Version zurück. Plus: 14 Tage Geld-zurück-Garantie.",
        },
        {
          q: "Was kostet es?",
          a: "Der Starter-Plan kostet €25/Monat mit 100 KI-Credits. Growth ist €50/Monat mit 250 Credits. Pro ist €99/Monat mit 500 Credits. Keine Einrichtungsgebühr.",
        },
      ],
    },
    finalCta: {
      badge: "Bereit zu bauen?",
      title: "Deine Website ist ein Gespräch entfernt",
      subtitle: "Beschreib es. KI baut es. In 60 Sekunden live.",
      cta: "Jetzt starten",
      trustNote: "Keine Kreditkarte. Kein Vertrag. Sofortiger Start.",
    },
    footer: {
      tagline: "KI-Website-Builder. Echter Code. Sofortiges Deployen.",
      copyright: "© 2026 madecreative.pro — KI-gestützter Website-Builder.",
      links: {
        privacy: "Datenschutz",
        cookies: "Cookie-Richtlinie",
        impressum: "Impressum",
        terms: "AGB",
      },
    },
    demoPage: {
      metaTitle: "Live Demo — MadeCreative KI-Website-Builder",
      metaDescription: "Sieh, wie unsere KI in Echtzeit echten React & Tailwind-Code schreibt und eine komplette Website aufbaut.",
      badge: "Live Demo",
      title: "Sieh die KI",
      titleHighlight: "beim Coden",
      subtitle: "Gib deine Firmendaten ein und sieh, wie unsere KI echten Next.js-Code schreibt und deine Website in Sekunden aufbaut.",
      labelCompany: "Unternehmensname",
      labelSector: "Branche",
      labelCity: "Stadt",
      labelCountry: "Land",
      sectorOptions: [
        { value: "ristorazione", label: "Restaurant & Gastronomie" },
        { value: "dental", label: "Zahnarztpraxis" },
        { value: "legale", label: "Rechtsanwaltskanzlei" },
        { value: "fitness", label: "Fitness & Sport" },
        { value: "beauty", label: "Beauty & Wellness" },
        { value: "hotel", label: "Hotel & Unterkunft" },
        { value: "ecommerce", label: "E-Commerce" },
        { value: "retail", label: "Einzelhandel" },
        { value: "professional", label: "Professionelle Dienstleistungen" },
      ],
      countryPlaceholder: "z.B. Deutschland",
      cta: "Website generieren",
      terminalSteps: [
        "KI analysiert deine Anfrage...",
        "React-Komponenten werden erstellt...",
        "Tailwind-Styles werden generiert...",
        "Next.js-Projekt wird gebaut...",
        "SEO wird optimiert...",
      ],
      previewTitle: "Deine Website ist fertig!",
      previewSubtitle: "KI hat in Sekunden eine komplette Website mit echtem React-Code erstellt.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Ladezeit: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Kostenlos starten",
      previewCtaNote: "Keine Kreditkarte erforderlich",
      tryAgain: "Nochmals versuchen",
    },
    prezziPage: {
      metaTitle: "Preise — MadeCreative KI-Website-Builder",
      metaDescription: "Transparente Preise ohne versteckte Gebühren. Starter ab €25/Monat. 14-tägige Geld-zurück-Garantie.",
      badge: "Transparente Preise",
      title: "Preise",
      subtitle: "Starte kostenlos. Upgrade wenn du bereit bist. Jederzeit kündbar.",
      monthly: "Monatlich",
      annual: "Jährlich",
      annualDiscount: "-20%",
      perMonth: "/Monat",
      setupFee: "Keine Einrichtungsgebühr",
      mostPopular: "Beliebteste",
      getStarted: "Jetzt starten",
      moneyBack: "14-tägige Geld-zurück-Garantie",
      moneyBackTitle: "14-tägige Geld-zurück-Garantie",
      moneyBackDesc: "Nicht zufrieden? Wir erstatten dir den vollen Betrag innerhalb von 14 Tagen — keine Fragen gestellt.",
      savingsLabel: "Du sparst €{n}/Jahr",
      billedAnnually: "Jährlich abgerechnet €{n}/Jahr",
      compareTitle: "Vollständiger Funktionsvergleich",
      faqTitle: "Häufig gestellte Fragen",
      tableCategories: {
        website: "Website-Builder",
        marketing: "Marketing",
        ai: "KI & Automation",
        support: "Support",
      },
      tableFeatures: {
        websites: "Websites",
        customDomain: "Eigene Domain",
        ssl: "SSL-Zertifikat",
        gdpr: "Cookie-Banner (DSGVO)",
        privacy: "Datenschutzerklärung",
        socialPosts: "KI-Credits/Monat",
        leads: "Seiten",
        seo: "SEO-Optimierung",
        googleAds: "Mehrsprachig",
        chatbots: "KI-Chatbot",
        automations: "Blog mit KI-Artikeln",
        aiAgents: "Analytics-Dashboard",
        emailSupport: "E-Mail-Support",
        prioritySupport: "Priority Support",
        accountManager: "Account Manager",
        phoneSupport: "99,9% SLA",
      },
      seoBasic: "Basis",
      seoAdvanced: "Fortgeschritten",
      seoFull: "Full Suite",
      plans: [
        {
          name: "Starter",
          description: "Perfekt für alle, die mit einem KI-Website-Builder starten wollen.",
          features: [
            "KI-Website-Builder",
            "100 KI-Credits/Monat",
            "5 Seiten",
            "Eigene Domain",
            "SSL inklusive",
            "SEO-Optimierung",
            "WhatsApp-Widget",
            "Monatliche Reports",
          ],
        },
        {
          name: "Growth",
          description: "Für wachsende Projekte mit mehr KI-Power und Funktionen.",
          features: [
            "Alles in Starter",
            "250 KI-Credits/Monat",
            "10 Seiten",
            "KI-Chatbot",
            "Blog mit KI-Artikeln",
            "Analytics-Dashboard",
            "Priority Support (4h)",
          ],
        },
        {
          name: "Pro",
          description: "Maximale KI-Power für professionelle Projekte und Agenturen.",
          features: [
            "Alles in Growth",
            "500 KI-Credits/Monat",
            "Unbegrenzte Seiten",
            "3 Standorte",
            "Mehrsprachig",
            "E-Mail-Kampagnen",
            "Account Manager",
            "99,9% SLA",
          ],
        },
      ],
    },
    useCases: {
      sectionLabel: "Für jedes Unternehmen",
      title: "Egal welches Unternehmen —",
      titleHighlight: "MadeCreative baut es.",
      subtitle:
        "Vom Familienrestaurant bis zum Series-A-Startup — die KI versteht Ihre Branche und erstellt eine Website, die Ihren spezifischen Anforderungen entspricht.",
      ctaNote: "Ihre Branche nicht dabei?",
      ctaLink: "Kostenlos testen — beschreiben Sie, was Sie brauchen.",
      items: [
        { name: "Restaurants & Gastronomie", tagline: "Menü, Reservierungen und Atmosphäre — in Minuten live.", description: "Menüseiten, Online-Buchungs-Widgets, Öffnungszeiten, Lagepläne und Galerie-Bereiche. Die KI weiß, was Restaurants brauchen, und baut es automatisch.", stats: "Beliebteste Kategorie" },
        { name: "Medizin & Zahnarztpraxen", tagline: "Professionelle Websites, denen Patienten sofort vertrauen.", description: "Terminbuchungsformulare, Leistungsbeschreibungen, Team-Profile, Kasseninformationen und Patienten-FAQs. Standardmäßig vollständig DSGVO-konform.", stats: "Zweitbeliebteste" },
        { name: "Beauty & Fitnessstudios", tagline: "Buchungen, Preise und Marke — wunderschön präsentiert.", description: "Leistungsmenüs, Kurszeiten, Vorher/Nachher-Galerien, Trainer-Biografien und Online-Buchung. Mobile-first für Kunden, die unterwegs buchen.", stats: "Wachsendes Segment" },
        { name: "Immobilienmakler", tagline: "Objekte, Lead-Erfassung und Makler-Profile.", description: "Immobilien-Suchseiten, Kontaktformulare, Maklerverzeichnisse, Stadtteilführer und virtuelle Besichtigungen. Für lokales SEO optimiert.", stats: "Hochwertige Konversionen" },
        { name: "E-Commerce-Shops", tagline: "Produktseiten, Warenkorb und Checkout — für Konversionen gebaut.", description: "Produktgalerien, Kategorieseiten, Warenkorb, Stripe-Integration und Bestellbestätigungsseiten. Die KI übernimmt den gesamten Kaufprozess.", stats: "Vollständiger Checkout enthalten" },
        { name: "Professionelle Dienstleistungen", tagline: "Anwälte, Steuerberater, Berater — Glaubwürdigkeit ab Tag eins.", description: "Leistungsseiten, Fallstudien, Team-Biografien, Beratungsbuchung und Kontaktformulare. Die KI schreibt professionelle Texte, die Autorität ausstrahlen.", stats: "B2B-Lead-Generierung" },
        { name: "Startups & SaaS", tagline: "Launch-Seiten, die Besucher zu Anmeldungen konvertieren.", description: "Hero-Bereiche, Feature-Vergleiche, Preistabellen, Testimonials und E-Mail-Erfassungsformulare. A/B-Test-Varianten mit einem einzigen KI-Prompt.", stats: "Schnellste Time-to-Live" },
        { name: "Portfolios & Kreative", tagline: "Zeigen Sie Ihre Arbeit. Werden Sie beauftragt. Kein Code nötig.", description: "Projekt-Galerien, Fallstudien-Seiten, Skills-Bereiche, Kontaktformulare und herunterladbare Lebensläufe. Die KI lässt Kreative so gut aussehen wie ihre Arbeit.", stats: "Von Designern geliebt" },
      ],
    },
    comparison: {
      sectionLabel: "Der Vergleich",
      title: "Warum MadeCreative wählen",
      titleHighlight: "statt der Alternativen?",
      subtitle:
        "Wix sperrt Sie in seinen Builder. WordPress braucht Plugins, Hosting und einen Entwickler. Custom Dev kostet Tausende. MadeCreative gibt Ihnen echten Code, KI-Geschwindigkeit und null Setup.",
      headers: { feature: "Funktion", madecreative: "MadeCreative", wix: "Wix", wordpress: "WordPress", custom: "Custom Dev" },
      best: "Beste Wahl",
      partial: "Eingeschränkt",
      footnote: 'Preise und Funktionen aktuell per April 2026. "Eingeschränkt" bedeutet, dass die Funktion Plugins, manuelle Einrichtung oder Drittanbieter-Tools erfordert.',
      features: [
        { name: "KI-Code-Generierung" },
        { name: "Echter React / Next.js-Output" },
        { name: "Chat-basiertes Bearbeiten" },
        { name: "Live-Vorschau" },
        { name: "Startpreis" },
        { name: "Sofortiges Deployen" },
        { name: "Eingebautes SEO" },
        { name: "Mobile Responsive" },
        { name: "Versionsverlauf" },
        { name: "Kein Code erforderlich" },
        { name: "Sie besitzen den Code" },
        { name: "Eigene Domain + SSL" },
      ],
      highlights: [
        { title: "Einziger KI-Builder mit echtem React-Output" },
        { title: "Keine Plugins. Kein Hosting-Ärger. Kein Code." },
        { title: "€25/Monat vs. €5.000+ für Custom Dev" },
      ],
    },
    testimonials: {
      sectionLabel: "Kundenstimmen",
      title: "Echte Unternehmen.",
      titleHighlight: "Echte Ergebnisse.",
      subtitle:
        "Von Restaurantbesitzern bis zu Startup-Gründern — erleben Sie, was passiert, wenn Sie €5.000-Agenturangebote durch ein 2-minütiges KI-Gespräch ersetzen.",
      items: [
        { name: "Marco R.", role: "Restaurantbesitzer", location: "Mailand, Italien", quote: "In 2 Minuten hatte ich eine Website, die mich mit einer Agentur €5.000 gekostet hätte. Ich tippte 'Erstelle eine Website für meine Trattoria in Mailand mit Online-Reservierungen' — und sie baute genau das: Menü, Fotos, Buchungs-Widget, alles. Meine Kunden können jetzt direkt über Google buchen.", result: "Reservierungen im ersten Monat +40 %" },
        { name: "Dr. Sarah B.", role: "Zahnärztin / Praxisinhaberin", location: "Wien, Österreich", quote: "Die KI hat genau verstanden, was meine Praxis braucht: Patientenvertrauen, professionelles Design, Terminbuchung und DSGVO-konforme Formulare. Ich war skeptisch wegen des medizinischen Bereichs, aber sie hat korrektes Schema.org-Markup generiert. Meine Patienten kommentieren immer, wie professionell es aussieht.", result: "Neue Patientenanfragen verdoppelt" },
        { name: "Thomas K.", role: "Startup-Gründer", location: "Berlin, Deutschland", quote: "Ich beschrieb meine SaaS-Landing-Page und sie baute genau das, was ich vor Augen hatte — Feature-Bereiche, Preistabelle, Testimonials, alles. Dann bat ich sie, ein Wartelisten-Formular hinzuzufügen, und sie tat es in 30 Sekunden. Was einem Freelancer eine Woche gedauert hätte, dauerte mir einen Nachmittag. Der Code ist sogar sauber.", result: "€0 für Entwicklung ausgegeben" },
        { name: "Lucia M.", role: "Beauty-Studio-Inhaberin", location: "Barcelona, Spanien", quote: "Ich habe null technisches Wissen und hatte Angst, es zu versuchen. Aber ich tippte, was ich wollte, und es hat einfach funktioniert. Schöne Galerie, Servicepreise, Instagram-Feed-Integration, ein Buchungs-Button. Meine Kunden sagen mir, dass es besser aussieht als das meiner Mitbewerber, die Agenturen Tausende bezahlt haben.", result: "In unter 1 Stunde vollständig live" },
      ],
      stats: [
        { value: "< 2 min", label: "Durchschnittliche Bauzeit" },
        { value: "€25/Mo.", label: "Startpreis" },
        { value: "95+", label: "PageSpeed-Wertung" },
      ],
      trust: [
        { icon: "★", text: "4,9/5 Durchschnittsbewertung" },
        { icon: "✓", text: "Keine Kreditkarte erforderlich" },
        { icon: "↺", text: "Jederzeit kündbar" },
      ],
    },
  },

  it: {
    meta: {
      title: "MadeCreative — AI website builder come Lovable",
      description:
        "Descrivi il tuo sito in chat — l'AI scrive vero codice React & Tailwind e ti mostra una preview live. Nessuna competenza di coding richiesta. Da €25/mese.",
    },
    nav: {
      howItWorks: "Come funziona",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Inizia gratis",
    },
    hero: {
      badge: "AI Website Builder",
      title: "Descrivilo.",
      titleHighlight: "L'AI lo costruisce.",
      subtitle:
        "Di' alla nostra AI cosa vuoi. Scrive vero codice React & Tailwind, ti mostra una preview live e fa il deploy in secondi. Nessuna competenza di coding richiesta.",
      cta: "Inizia a costruire gratis",
      ctaSecondary: "Guarda come funziona",
      trustNote: "Nessuna carta di credito · Piano gratuito disponibile",
      urlPlaceholder: "Inserisci l'URL del tuo sito per un'analisi gratuita",
      urlCta: "Analizza",
    },
    howItWorks: {
      sectionLabel: "Come Funziona",
      title: "Come funziona MadeCreative",
      subtitle: "Tre passi. Zero codice. Infinite possibilità.",
      steps: [
        {
          number: "01",
          title: "Descrivi",
          description:
            "Di' all'AI cosa vuoi — un sito per ristorante, un e-commerce, un portfolio. Con tutti i dettagli che vuoi o in modo vago.",
        },
        {
          number: "02",
          title: "Guarda come costruisce",
          description:
            "La nostra AI scrive vero codice Next.js + Tailwind in tempo reale. Vedi ogni file creato, ogni componente costruito — live.",
        },
        {
          number: "03",
          title: "Deploy & modifica",
          description:
            "Il tuo sito va live istantaneamente sul tuo dominio personalizzato. Continua a chattare per fare modifiche — l'AI edita qualsiasi sezione in secondi.",
        },
      ],
    },
    features: {
      sectionLabel: "Cosa Include",
      title: "Tutto ciò di cui hai bisogno",
      subtitle: "Un'AI. Codice vero. Siti infiniti.",
      worksForAnyIndustry: "Adatto a qualsiasi settore",
      responsiveOnEveryDevice: "Responsive su ogni dispositivo",
      items: [
        {
          title: "Generazione di Codice AI",
          description:
            "Vero codice React & Tailwind, non template. Ogni sito è unico, creato su misura dall'AI.",
        },
        {
          title: "Preview Live",
          description:
            "Vedi le modifiche in tempo reale mentre l'AI scrive codice. Come fare pair programming con uno sviluppatore senior.",
        },
        {
          title: "Qualsiasi Tipo di Sito",
          description:
            "Landing page, e-commerce, portfolio, blog, dashboard — descrivilo e l'AI lo costruisce.",
        },
        {
          title: "SEO Integrato",
          description:
            "Schema.org, Open Graph, meta tag, sitemap — tutto generato automaticamente.",
        },
        {
          title: "Editor AI via Chat",
          description:
            "Descrivi le modifiche in linguaggio naturale. L'AI capisce il contesto e modifica in modo chirurgico.",
        },
        {
          title: "Deploy Istantaneo",
          description:
            "Un click per andare live. Dominio personalizzato, SSL, CDN — tutto incluso.",
        },
      ],
    },
    demo: {
      sectionLabel: "Demo Live",
      title: "Vedilo in azione",
      subtitle: "Inserisci il nome di un'azienda e guarda l'AI costruire un sito completo in secondi",
      namePlaceholder: "es. Pizzeria Bella Italia",
      sectorPlaceholder: "es. Ristorante, Parrucchiere, Dentista...",
      cityPlaceholder: "es. Milano",
      cta: "Genera il mio sito",
      loading: "L'AI sta costruendo...",
      successTitle: "Il tuo sito è pronto!",
      successSubtitle:
        "L'AI ha creato in secondi un sito completo con vero codice React & Tailwind.",
      successNote: "Inizia gratis ora — nessuna carta di credito richiesta.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Domande frequenti",
      items: [
        {
          q: "Ho bisogno di saper programmare?",
          a: "Per niente. Descrivi semplicemente quello che vuoi in linguaggio naturale — italiano, inglese, tedesco, qualsiasi lingua. L'AI gestisce tutto il codice.",
        },
        {
          q: "Che tipo di siti posso costruire?",
          a: "Qualsiasi cosa: landing page, siti multipagina, e-commerce, portfolio, blog, sistemi di prenotazione, dashboard. L'AI scrive vero codice React — non ci sono limiti.",
        },
        {
          q: "Posso modificare il sito dopo averlo costruito?",
          a: "Sì! Chatta con l'AI: 'cambia il colore dell'hero in blu', 'aggiungi una sezione prezzi', 'ingrandisci la galleria'. Modifica il codice in tempo reale.",
        },
        {
          q: "Qual è la differenza rispetto a Wix o WordPress?",
          a: "MadeCreative genera vero codice Next.js — non blocchi drag-and-drop. Il tuo sito è più veloce, più personalizzabile e davvero unico.",
        },
        {
          q: "Cosa succede con il SEO?",
          a: "Ogni sito riceve markup Schema.org, tag Open Graph, meta description ottimizzate, HTML semantico e una sitemap — tutto automatico.",
        },
        {
          q: "Posso usare il mio dominio?",
          a: "Sì. Collega qualsiasi dominio con un click. Certificato SSL incluso gratuitamente.",
        },
        {
          q: "E se non mi piace il risultato?",
          a: "Continua a chattare! Di' all'AI cosa cambiare. Oppure torna a qualsiasi versione precedente con un click. Più garanzia soddisfatti o rimborsati di 14 giorni.",
        },
        {
          q: "Quanto costa?",
          a: "Il piano Starter è €25/mese con 100 crediti AI. Growth è €50/mese con 250 crediti. Pro è €99/mese con 500 crediti. Nessun costo di setup.",
        },
      ],
    },
    finalCta: {
      badge: "Pronto a costruire?",
      title: "Il tuo sito è a una conversazione di distanza",
      subtitle: "Descrivilo. L'AI lo costruisce. Deploy in 60 secondi.",
      cta: "Inizia a costruire ora",
      trustNote: "Nessuna carta di credito. Nessun contratto. Inizio immediato.",
    },
    footer: {
      tagline: "AI website builder. Codice vero. Deploy istantaneo.",
      copyright: "© 2026 madecreative.pro — AI website builder.",
      links: {
        privacy: "Privacy Policy",
        cookies: "Cookie Policy",
        impressum: "Impressum",
        terms: "Termini",
      },
    },
    demoPage: {
      metaTitle: "Demo Live — MadeCreative AI Website Builder",
      metaDescription: "Guarda la nostra AI scrivere vero codice React & Tailwind in tempo reale e costruire un sito completo.",
      badge: "Demo Live",
      title: "Guarda l'AI",
      titleHighlight: "scrivere codice",
      subtitle: "Inserisci i dati della tua azienda e guarda la nostra AI scrivere vero codice Next.js e costruire il tuo sito in secondi.",
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
      cta: "Genera il mio sito",
      terminalSteps: [
        "L'AI analizza la tua richiesta...",
        "Componenti React in costruzione...",
        "Stili Tailwind generati...",
        "Progetto Next.js in build...",
        "SEO ottimizzato...",
      ],
      previewTitle: "Il tuo sito è pronto!",
      previewSubtitle: "L'AI ha creato un sito completo con vero codice React in secondi.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Caricamento: 1.2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Inizia gratis",
      previewCtaNote: "Nessuna carta di credito richiesta",
      tryAgain: "Riprova",
    },
    prezziPage: {
      metaTitle: "Prezzi — MadeCreative AI Website Builder",
      metaDescription: "Prezzi trasparenti senza costi nascosti. Starter da €25/mese. Garanzia soddisfatti o rimborsati 14 giorni.",
      badge: "Prezzi Trasparenti",
      title: "Prezzi",
      subtitle: "Inizia gratis. Fai upgrade quando sei pronto. Cancella quando vuoi.",
      monthly: "Mensile",
      annual: "Annuale",
      annualDiscount: "-20%",
      perMonth: "/mese",
      setupFee: "Nessun costo di setup",
      mostPopular: "Più popolare",
      getStarted: "Inizia ora",
      moneyBack: "Garanzia 14 giorni",
      moneyBackTitle: "Garanzia soddisfatti o rimborsati 14 giorni",
      moneyBackDesc: "Non sei soddisfatto? Ti rimborsiamo completamente entro 14 giorni — nessuna domanda.",
      savingsLabel: "Risparmi €{n}/anno",
      billedAnnually: "Fatturato annualmente €{n}/anno",
      compareTitle: "Confronto completo delle funzionalità",
      faqTitle: "Domande frequenti",
      tableCategories: {
        website: "Website Builder",
        marketing: "Marketing",
        ai: "AI & Automazione",
        support: "Supporto",
      },
      tableFeatures: {
        websites: "Siti web",
        customDomain: "Dominio personalizzato",
        ssl: "Certificato SSL",
        gdpr: "Cookie banner (GDPR)",
        privacy: "Privacy policy",
        socialPosts: "Crediti AI/mese",
        leads: "Pagine",
        seo: "Ottimizzazione SEO",
        googleAds: "Multilingua",
        chatbots: "Chatbot AI",
        automations: "Blog con articoli AI",
        aiAgents: "Dashboard analytics",
        emailSupport: "Supporto email",
        prioritySupport: "Supporto prioritario",
        accountManager: "Account manager",
        phoneSupport: "SLA 99,9%",
      },
      seoBasic: "Base",
      seoAdvanced: "Avanzato",
      seoFull: "Suite completa",
      plans: [
        {
          name: "Starter",
          description: "Perfetto per iniziare a costruire siti con l'AI.",
          features: [
            "AI website builder",
            "100 crediti AI/mese",
            "5 pagine",
            "Dominio personalizzato",
            "SSL incluso",
            "Ottimizzazione SEO",
            "Widget WhatsApp",
            "Report mensili",
          ],
        },
        {
          name: "Growth",
          description: "Per progetti in crescita con più potenza AI e funzionalità.",
          features: [
            "Tutto di Starter",
            "250 crediti AI/mese",
            "10 pagine",
            "Chatbot AI",
            "Blog con articoli AI",
            "Dashboard analytics",
            "Supporto prioritario (4h)",
          ],
        },
        {
          name: "Pro",
          description: "Massima potenza AI per progetti professionali e agenzie.",
          features: [
            "Tutto di Growth",
            "500 crediti AI/mese",
            "Pagine illimitate",
            "3 sedi",
            "Multilingua",
            "Campagne email",
            "Account manager",
            "SLA 99,9%",
          ],
        },
      ],
    },
    useCases: {
      sectionLabel: "Per ogni attività",
      title: "Qualunque sia la tua attività —",
      titleHighlight: "MadeCreative la costruisce.",
      subtitle:
        "Dal ristorante di famiglia alla startup in crescita — l'AI comprende il tuo settore e genera un sito che risponde alle tue esigenze specifiche.",
      ctaNote: "Non vedi il tuo settore?",
      ctaLink: "Provalo gratis — descrivi quello di cui hai bisogno.",
      items: [
        { name: "Ristoranti & Ospitalità", tagline: "Menu, prenotazioni e atmosfera — live in pochi minuti.", description: "Pagine menu, widget di prenotazione online, orari di apertura, mappe e sezioni galleria. L'AI sa cosa serve ai ristoranti e lo costruisce automaticamente.", stats: "Categoria più popolare" },
        { name: "Studi Medici & Dentistici", tagline: "Siti professionali di cui i pazienti si fidano subito.", description: "Moduli di prenotazione, descrizioni dei servizi, profili del team, info assicurative e FAQ. Completamente conforme al GDPR per impostazione predefinita.", stats: "Seconda più popolare" },
        { name: "Beauty & Fitness", tagline: "Prenotazioni, prezzi e brand — presentati in modo splendido.", description: "Menu servizi, orari corsi, gallerie prima/dopo, biografie istruttori e prenotazione online. Mobile-first per clienti che prenotano in mobilità.", stats: "Segmento in forte crescita" },
        { name: "Agenzie Immobiliari", tagline: "Annunci, acquisizione lead e profili agenti.", description: "Pagine di ricerca immobiliare, moduli di contatto, directory agenti, guide quartieri e virtual tour. Ottimizzato per la SEO locale.", stats: "Conversioni di alto valore" },
        { name: "E-commerce", tagline: "Schede prodotto, carrello e checkout — costruiti per convertire.", description: "Gallerie prodotti, pagine categoria, carrello, integrazione Stripe e pagine di conferma ordine. L'AI gestisce l'intero funnel di acquisto.", stats: "Checkout completo incluso" },
        { name: "Professionisti & Consulenti", tagline: "Avvocati, commercialisti, consulenti — credibilità dal giorno uno.", description: "Pagine servizi, case study, biografie del team, prenotazione consulenze e moduli di contatto. L'AI scrive testi professionali che stabiliscono autorità.", stats: "Generazione lead B2B" },
        { name: "Startup & SaaS", tagline: "Pagine di lancio che convertono i visitatori in iscritti.", description: "Hero section, confronto funzionalità, tabelle prezzi, testimonianze e moduli di cattura email. Varianti A/B con un singolo prompt AI.", stats: "Time-to-live più rapido" },
        { name: "Portfolio & Creativi", tagline: "Mostra il tuo lavoro. Ottieni clienti. Nessun codice.", description: "Gallerie progetti, pagine case study, sezioni competenze, moduli contatto e CV scaricabili. L'AI fa sembrare i creativi bravi quanto il loro lavoro.", stats: "Amato dai designer" },
      ],
    },
    comparison: {
      sectionLabel: "Il confronto",
      title: "Perché scegliere MadeCreative",
      titleHighlight: "rispetto alle alternative?",
      subtitle:
        "Wix ti blocca nel suo builder. WordPress richiede plugin, hosting e uno sviluppatore. Il custom dev costa migliaia. MadeCreative ti dà codice vero, velocità AI e zero configurazione.",
      headers: { feature: "Funzionalità", madecreative: "MadeCreative", wix: "Wix", wordpress: "WordPress", custom: "Custom Dev" },
      best: "Il migliore",
      partial: "Parziale",
      footnote: 'Prezzi e funzionalità aggiornati ad aprile 2026. "Parziale" indica che la funzione richiede plugin, configurazione manuale o strumenti di terze parti.',
      features: [
        { name: "Generazione codice AI" },
        { name: "Output React / Next.js vero" },
        { name: "Editing via chat" },
        { name: "Anteprima live" },
        { name: "Prezzo di partenza" },
        { name: "Deploy istantaneo" },
        { name: "SEO integrato" },
        { name: "Responsive mobile" },
        { name: "Cronologia versioni" },
        { name: "Nessun codice richiesto" },
        { name: "Sei proprietario del codice" },
        { name: "Dominio personalizzato + SSL" },
      ],
      highlights: [
        { title: "L'unico AI builder con output React reale" },
        { title: "Nessun plugin. Nessun problema di hosting. Nessun codice." },
        { title: "€25/mese vs €5.000+ per il custom dev" },
      ],
    },
    testimonials: {
      sectionLabel: "Storie dei clienti",
      title: "Aziende reali.",
      titleHighlight: "Risultati reali.",
      subtitle:
        "Da ristoratori a fondatori di startup — scopri cosa succede quando sostituisci i preventivi da €5.000 delle agenzie con una conversazione AI di 2 minuti.",
      items: [
        { name: "Marco R.", role: "Titolare di ristorante", location: "Milano, Italia", quote: "In 2 minuti avevo un sito che con un'agenzia mi sarebbe costato €5.000. Ho scritto 'crea un sito per la mia trattoria a Milano con prenotazioni online' e ha costruito esattamente quello — menù, foto, widget prenotazione, tutto. I miei clienti ora possono prenotare direttamente da Google.", result: "Prenotazioni +40% nel primo mese" },
        { name: "Dott.ssa Sarah B.", role: "Titolare di studio dentistico", location: "Vienna, Austria", quote: "L'AI ha capito esattamente cosa serviva alla mia clinica — fiducia dei pazienti, design professionale, prenotazione appuntamenti e moduli GDPR-compliant. Ero preoccupata per il settore medico ma ha generato il corretto markup Schema.org e tutto era corretto. I miei pazienti commentano sempre quanto appare professionale.", result: "Nuove richieste pazienti raddoppiate" },
        { name: "Thomas K.", role: "Founder di startup", location: "Berlino, Germania", quote: "Ho descritto la mia landing page SaaS e ha costruito esattamente quello che avevo in mente — sezioni feature, tabella prezzi, testimonianze, tutto. Poi le ho chiesto di aggiungere un modulo di waitlist e lo ha fatto in 30 secondi. Quello che avrebbe impiegato una settimana a un freelance mi ha preso un pomeriggio. Il codice è anche pulito.", result: "€0 spesi in sviluppo" },
        { name: "Lucia M.", role: "Titolare di beauty studio", location: "Barcellona, Spagna", quote: "Ho zero conoscenze tecniche e avevo paura di provare. Ma ho digitato quello che volevo e ha funzionato. Galleria bellissima, prezzi servizi, integrazione feed Instagram, un pulsante di prenotazione. I miei clienti mi dicono che sembra meglio di quello dei miei concorrenti che hanno pagato migliaia alle agenzie.", result: "Online in meno di 1 ora" },
      ],
      stats: [
        { value: "< 2 min", label: "Tempo medio di costruzione" },
        { value: "€25/mese", label: "Prezzo di partenza" },
        { value: "95+", label: "Punteggio PageSpeed" },
      ],
      trust: [
        { icon: "★", text: "4,9/5 valutazione media" },
        { icon: "✓", text: "Nessuna carta di credito richiesta" },
        { icon: "↺", text: "Cancella quando vuoi" },
      ],
    },
  },

  es: {
    meta: {
      title: "MadeCreative — AI website builder como Lovable",
      description:
        "Describe tu web en el chat — la IA escribe código React & Tailwind real y te muestra una preview en vivo. Sin necesidad de programar. Desde €25/mes.",
    },
    nav: {
      howItWorks: "Cómo funciona",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Empezar gratis",
    },
    hero: {
      badge: "AI Website Builder",
      title: "Descríbelo.",
      titleHighlight: "La IA lo construye.",
      subtitle:
        "Dile a nuestra IA lo que quieres. Escribe código React & Tailwind real, te muestra una preview en vivo y hace el deploy en segundos. Sin necesidad de programar.",
      cta: "Empezar a construir gratis",
      ctaSecondary: "Míralo funcionar",
      trustNote: "Sin tarjeta de crédito · Plan gratuito disponible",
      urlPlaceholder: "Introduce la URL de tu web para un análisis gratuito",
      urlCta: "Analizar",
    },
    howItWorks: {
      sectionLabel: "Cómo Funciona",
      title: "Cómo funciona MadeCreative",
      subtitle: "Tres pasos. Cero código. Infinitas posibilidades.",
      steps: [
        {
          number: "01",
          title: "Describe",
          description:
            "Dile a la IA lo que quieres — un sitio de restaurante, una tienda online, un portfolio. Con todos los detalles que quieras o de forma vaga.",
        },
        {
          number: "02",
          title: "Mira cómo lo construye",
          description:
            "Nuestra IA escribe código Next.js + Tailwind real en tiempo real. Ves cada archivo creado, cada componente construido — en vivo.",
        },
        {
          number: "03",
          title: "Deploy y edición",
          description:
            "Tu web se publica al instante en tu dominio personalizado. Sigue chateando para hacer cambios — la IA edita cualquier sección en segundos.",
        },
      ],
    },
    features: {
      sectionLabel: "Qué Incluye",
      title: "Todo lo que necesitas",
      subtitle: "Una IA. Código real. Webs infinitas.",
      worksForAnyIndustry: "Funciona para cualquier sector",
      responsiveOnEveryDevice: "Responsive en todos los dispositivos",
      items: [
        {
          title: "Generación de Código IA",
          description:
            "Código React & Tailwind real, no plantillas. Cada web es única, diseñada a medida por la IA.",
        },
        {
          title: "Preview en Vivo",
          description:
            "Ve los cambios en tiempo real mientras la IA escribe código. Como hacer pair programming con un desarrollador senior.",
        },
        {
          title: "Cualquier Tipo de Web",
          description:
            "Landing pages, e-commerce, portfolios, blogs, dashboards — descríbelo y la IA lo construye.",
        },
        {
          title: "SEO Integrado",
          description:
            "Schema.org, Open Graph, meta tags, sitemap — todo generado automáticamente.",
        },
        {
          title: "Editor IA via Chat",
          description:
            "Describe los cambios en lenguaje natural. La IA entiende el contexto y edita quirúrgicamente.",
        },
        {
          title: "Deploy Instantáneo",
          description:
            "Un clic para publicar. Dominio propio, SSL, CDN — todo incluido.",
        },
      ],
    },
    demo: {
      sectionLabel: "Demo en Vivo",
      title: "Míralo en acción",
      subtitle: "Introduce el nombre de una empresa y mira cómo la IA construye una web completa en segundos",
      namePlaceholder: "ej. Restaurante García",
      sectorPlaceholder: "ej. Restaurante, Peluquería, Dentista...",
      cityPlaceholder: "ej. Madrid",
      cta: "Generar mi web",
      loading: "La IA está construyendo...",
      successTitle: "¡Tu web está lista!",
      successSubtitle:
        "La IA ha creado en segundos una web completa con código React & Tailwind real.",
      successNote: "Empieza gratis ahora — sin tarjeta de crédito.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Necesito saber programar?",
          a: "Para nada. Solo describe lo que quieres en lenguaje natural — español, inglés, alemán, cualquier idioma. La IA gestiona todo el código.",
        },
        {
          q: "¿Qué tipo de webs puedo construir?",
          a: "Cualquier cosa: landing pages, webs multipágina, tiendas online, portfolios, blogs, sistemas de reservas, dashboards. La IA escribe código React real — no hay límites.",
        },
        {
          q: "¿Puedo editar mi web después de construirla?",
          a: "¡Sí! Chatea con la IA: 'cambia el color del hero a azul', 'añade una sección de precios', 'agranda la galería'. Edita el código en tiempo real.",
        },
        {
          q: "¿Cuál es la diferencia respecto a Wix o WordPress?",
          a: "MadeCreative genera código Next.js real — no bloques de arrastrar y soltar. Tu web es más rápida, más personalizable y verdaderamente única.",
        },
        {
          q: "¿Qué pasa con el SEO?",
          a: "Cada web recibe markup Schema.org, tags Open Graph, meta descriptions optimizadas, HTML semántico y un sitemap — todo automático.",
        },
        {
          q: "¿Puedo usar mi propio dominio?",
          a: "Sí. Conecta cualquier dominio con un clic. Certificado SSL incluido gratis.",
        },
        {
          q: "¿Y si no me gusta el resultado?",
          a: "¡Sigue chateando! Dile a la IA qué cambiar. O vuelve a cualquier versión anterior con un clic. Además, garantía de devolución de 14 días.",
        },
        {
          q: "¿Cuánto cuesta?",
          a: "El plan Starter es €25/mes con 100 créditos IA. Growth es €50/mes con 250 créditos. Pro es €99/mes con 500 créditos. Sin coste de setup.",
        },
      ],
    },
    finalCta: {
      badge: "¿Listo para construir?",
      title: "Tu web está a una conversación de distancia",
      subtitle: "Descríbela. La IA la construye. Deploy en 60 segundos.",
      cta: "Empezar a construir ahora",
      trustNote: "Sin tarjeta de crédito. Sin contrato. Inicio inmediato.",
    },
    footer: {
      tagline: "AI website builder. Código real. Deploy instantáneo.",
      copyright: "© 2026 madecreative.pro — AI website builder.",
      links: {
        privacy: "Política de Privacidad",
        cookies: "Política de Cookies",
        impressum: "Aviso Legal",
        terms: "Términos",
      },
    },
    demoPage: {
      metaTitle: "Demo en Vivo — MadeCreative AI Website Builder",
      metaDescription: "Mira nuestra IA escribir código React & Tailwind real en tiempo real y construir una web completa.",
      badge: "Demo en Vivo",
      title: "Mira la IA",
      titleHighlight: "escribir código",
      subtitle: "Introduce los datos de tu empresa y mira nuestra IA escribir código Next.js real y construir tu web en segundos.",
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
      cta: "Generar mi web",
      terminalSteps: [
        "La IA analiza tu solicitud...",
        "Componentes React en construcción...",
        "Estilos Tailwind generados...",
        "Proyecto Next.js en build...",
        "SEO optimizado...",
      ],
      previewTitle: "¡Tu web está lista!",
      previewSubtitle: "La IA ha creado una web completa con código React real en segundos.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Carga: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Empezar gratis",
      previewCtaNote: "Sin tarjeta de crédito",
      tryAgain: "Intentar de nuevo",
    },
    prezziPage: {
      metaTitle: "Precios — MadeCreative AI Website Builder",
      metaDescription: "Precios transparentes sin costes ocultos. Starter desde €25/mes. Garantía de devolución 14 días.",
      badge: "Precios Transparentes",
      title: "Precios",
      subtitle: "Empieza gratis. Haz upgrade cuando estés listo. Cancela cuando quieras.",
      monthly: "Mensual",
      annual: "Anual",
      annualDiscount: "-20%",
      perMonth: "/mes",
      setupFee: "Sin coste de setup",
      mostPopular: "Más popular",
      getStarted: "Empezar ahora",
      moneyBack: "Garantía 14 días",
      moneyBackTitle: "Garantía de devolución 14 días",
      moneyBackDesc: "¿No estás satisfecho? Te reembolsamos completamente en 14 días — sin preguntas.",
      savingsLabel: "Ahorras €{n}/año",
      billedAnnually: "Facturado anualmente €{n}/año",
      compareTitle: "Comparativa completa de funcionalidades",
      faqTitle: "Preguntas frecuentes",
      tableCategories: {
        website: "Website Builder",
        marketing: "Marketing",
        ai: "IA & Automatización",
        support: "Soporte",
      },
      tableFeatures: {
        websites: "Sitios web",
        customDomain: "Dominio personalizado",
        ssl: "Certificado SSL",
        gdpr: "Banner de cookies (RGPD)",
        privacy: "Política de privacidad",
        socialPosts: "Créditos IA/mes",
        leads: "Páginas",
        seo: "Optimización SEO",
        googleAds: "Multilingüe",
        chatbots: "Chatbot IA",
        automations: "Blog con artículos IA",
        aiAgents: "Dashboard analytics",
        emailSupport: "Soporte email",
        prioritySupport: "Soporte prioritario",
        accountManager: "Account manager",
        phoneSupport: "SLA 99,9%",
      },
      seoBasic: "Básico",
      seoAdvanced: "Avanzado",
      seoFull: "Suite completa",
      plans: [
        {
          name: "Starter",
          description: "Perfecto para empezar a construir webs con IA.",
          features: [
            "AI website builder",
            "100 créditos IA/mes",
            "5 páginas",
            "Dominio personalizado",
            "SSL incluido",
            "Optimización SEO",
            "Widget WhatsApp",
            "Informes mensuales",
          ],
        },
        {
          name: "Growth",
          description: "Para proyectos en crecimiento con más potencia IA y funcionalidades.",
          features: [
            "Todo de Starter",
            "250 créditos IA/mes",
            "10 páginas",
            "Chatbot IA",
            "Blog con artículos IA",
            "Dashboard analytics",
            "Soporte prioritario (4h)",
          ],
        },
        {
          name: "Pro",
          description: "Máxima potencia IA para proyectos profesionales y agencias.",
          features: [
            "Todo de Growth",
            "500 créditos IA/mes",
            "Páginas ilimitadas",
            "3 ubicaciones",
            "Multilingüe",
            "Campañas email",
            "Account manager",
            "SLA 99,9%",
          ],
        },
      ],
    },
    useCases: {
      sectionLabel: "Para cada negocio",
      title: "Sea cual sea tu negocio —",
      titleHighlight: "MadeCreative lo construye.",
      subtitle:
        "Desde el restaurante familiar hasta la startup en crecimiento — la IA entiende tu sector y genera un sitio que se adapta a tus necesidades específicas.",
      ctaNote: "¿No ves tu sector?",
      ctaLink: "Pruébalo gratis — describe lo que necesitas.",
      items: [
        { name: "Restaurantes & Hostelería", tagline: "Menús, reservas y ambiente — en vivo en minutos.", description: "Páginas de menú, widgets de reserva online, horarios, mapas y galerías. La IA sabe lo que necesitan los restaurantes y lo construye automáticamente.", stats: "Categoría más popular" },
        { name: "Clínicas Médicas & Dentales", tagline: "Sitios profesionales en los que los pacientes confían al instante.", description: "Formularios de cita, descripciones de servicios, perfiles del equipo, info de seguros y FAQs. Totalmente compatible con GDPR por defecto.", stats: "Segunda más popular" },
        { name: "Belleza & Fitness", tagline: "Reservas, precios y marca — presentados de forma impecable.", description: "Menús de servicios, horarios de clases, galerías antes/después, bios de instructores y reserva online. Mobile-first para clientes que reservan desde el móvil.", stats: "Segmento en rápido crecimiento" },
        { name: "Agencias Inmobiliarias", tagline: "Listados, captación de leads y perfiles de agentes.", description: "Páginas de búsqueda inmobiliaria, formularios de contacto, directorios de agentes, guías de barrios y tours virtuales. Optimizado para SEO local.", stats: "Conversiones de alto valor" },
        { name: "Tiendas E-commerce", tagline: "Fichas de producto, carrito y checkout — construidos para convertir.", description: "Galerías de productos, páginas de categoría, carrito de compra, integración Stripe y páginas de confirmación. La IA gestiona todo el embudo de compra.", stats: "Checkout completo incluido" },
        { name: "Servicios Profesionales", tagline: "Abogados, asesores, consultores — credibilidad desde el día uno.", description: "Páginas de servicios, casos de éxito, bios del equipo, reserva de consultas y formularios de contacto. La IA escribe textos profesionales que generan autoridad.", stats: "Generación de leads B2B" },
        { name: "Startups & SaaS", tagline: "Landing pages que convierten visitantes en registros.", description: "Secciones hero, comparativas de funcionalidades, tablas de precios, testimonios y formularios de captación de email. Variantes A/B con un solo prompt de IA.", stats: "Time-to-live más rápido" },
        { name: "Portfolios & Creativos", tagline: "Muestra tu trabajo. Consigue clientes. Sin código.", description: "Galerías de proyectos, páginas de casos de estudio, secciones de habilidades, formularios de contacto y CVs descargables. La IA hace que los creativos luzcan tan bien como su trabajo.", stats: "Amado por diseñadores" },
      ],
    },
    comparison: {
      sectionLabel: "La comparativa",
      title: "¿Por qué elegir MadeCreative",
      titleHighlight: "en lugar de las alternativas?",
      subtitle:
        "Wix te ata a su constructor. WordPress necesita plugins, hosting y un desarrollador. El desarrollo a medida cuesta miles. MadeCreative te da código real, velocidad de IA y cero configuración.",
      headers: { feature: "Funcionalidad", madecreative: "MadeCreative", wix: "Wix", wordpress: "WordPress", custom: "Desarrollo a medida" },
      best: "La mejor opción",
      partial: "Parcial",
      footnote: 'Precios y funcionalidades actualizados a abril de 2026. "Parcial" indica que la función requiere plugins, configuración manual o herramientas de terceros.',
      features: [
        { name: "Generación de código IA" },
        { name: "Output React / Next.js real" },
        { name: "Edición por chat" },
        { name: "Preview en vivo" },
        { name: "Precio de entrada" },
        { name: "Deploy instantáneo" },
        { name: "SEO integrado" },
        { name: "Responsive en móvil" },
        { name: "Historial de versiones" },
        { name: "Sin código necesario" },
        { name: "Tú eres dueño del código" },
        { name: "Dominio propio + SSL" },
      ],
      highlights: [
        { title: "El único AI builder con output React real" },
        { title: "Sin plugins. Sin líos de hosting. Sin código." },
        { title: "€25/mes vs €5.000+ en desarrollo a medida" },
      ],
    },
    testimonials: {
      sectionLabel: "Historias de clientes",
      title: "Negocios reales.",
      titleHighlight: "Resultados reales.",
      subtitle:
        "Desde dueños de restaurantes hasta fundadores de startups — descubre qué pasa cuando sustituyes los presupuestos de €5.000 de agencia por una conversación de 2 minutos con IA.",
      items: [
        { name: "Marco R.", role: "Dueño de restaurante", location: "Milán, Italia", quote: "En 2 minutos tenía un sitio que con una agencia me habría costado €5.000. Escribí 'crea un sitio para mi trattoria en Milán con reservas online' y construyó exactamente eso — menú, fotos, widget de reservas, todo. Mis clientes ahora pueden reservar directamente desde Google.", result: "Reservas +40% en el primer mes" },
        { name: "Dra. Sarah B.", role: "Propietaria de clínica dental", location: "Viena, Austria", quote: "La IA entendió exactamente lo que necesitaba mi clínica — confianza del paciente, diseño profesional, reserva de citas y formularios GDPR-compliant. Estaba preocupada por el sector médico pero generó el markup Schema.org correcto y todo estaba bien. Mis pacientes siempre comentan lo profesional que se ve.", result: "Nuevas consultas de pacientes duplicadas" },
        { name: "Thomas K.", role: "Fundador de startup", location: "Berlín, Alemania", quote: "Describí mi landing page SaaS y construyó exactamente lo que tenía en mente — secciones de features, tabla de precios, testimonios, todo. Luego le pedí que añadiera un formulario de lista de espera y lo hizo en 30 segundos. Lo que le habría llevado una semana a un freelance me llevó una tarde. El código encima está limpio.", result: "€0 gastado en desarrollo" },
        { name: "Lucia M.", role: "Propietaria de estudio de belleza", location: "Barcelona, España", quote: "No tengo conocimientos técnicos y tenía miedo de intentarlo. Pero escribí lo que quería y simplemente funcionó. Galería preciosa, precios de servicios, integración del feed de Instagram, un botón de reserva. Mis clientes me dicen que se ve mejor que el de mis competidores que pagaron miles a agencias.", result: "Completamente live en menos de 1 hora" },
      ],
      stats: [
        { value: "< 2 min", label: "Tiempo medio de construcción" },
        { value: "€25/mes", label: "Precio de entrada" },
        { value: "95+", label: "Puntuación PageSpeed" },
      ],
      trust: [
        { icon: "★", text: "4,9/5 valoración media" },
        { icon: "✓", text: "Sin tarjeta de crédito" },
        { icon: "↺", text: "Cancela cuando quieras" },
      ],
    },
  },

  fr: {
    meta: {
      title: "MadeCreative — AI website builder comme Lovable",
      description:
        "Décrivez votre site en chat — l'IA écrit du vrai code React & Tailwind et vous montre un aperçu en direct. Aucune compétence en coding requise. À partir de €25/mois.",
    },
    nav: {
      howItWorks: "Comment ça marche",
      demo: "Démo",
      faq: "FAQ",
      startFree: "Commencer gratuitement",
    },
    hero: {
      badge: "AI Website Builder",
      title: "Décrivez-le.",
      titleHighlight: "L'IA le construit.",
      subtitle:
        "Dites à notre IA ce que vous voulez. Elle écrit du vrai code React & Tailwind, vous montre un aperçu en direct et déploie en secondes. Aucun coding nécessaire.",
      cta: "Commencer à construire gratuitement",
      ctaSecondary: "Voir comment ça fonctionne",
      trustNote: "Sans carte bancaire · Plan gratuit disponible",
      urlPlaceholder: "Entrez l'URL de votre site pour une analyse gratuite",
      urlCta: "Analyser",
    },
    howItWorks: {
      sectionLabel: "Comment Ça Marche",
      title: "Comment fonctionne MadeCreative",
      subtitle: "Trois étapes. Zéro code. Infinies possibilités.",
      steps: [
        {
          number: "01",
          title: "Décrivez",
          description:
            "Dites à l'IA ce que vous voulez — un site de restaurant, une boutique en ligne, un portfolio. Avec autant de détails que vous le souhaitez.",
        },
        {
          number: "02",
          title: "Regardez-la construire",
          description:
            "Notre IA écrit du vrai code Next.js + Tailwind en temps réel. Vous voyez chaque fichier créé, chaque composant construit — en direct.",
        },
        {
          number: "03",
          title: "Déployer & modifier",
          description:
            "Votre site est mis en ligne instantanément sur votre domaine personnalisé. Continuez à chatter pour faire des modifications — l'IA édite n'importe quelle section en secondes.",
        },
      ],
    },
    features: {
      sectionLabel: "Ce Qui Est Inclus",
      title: "Tout ce dont vous avez besoin",
      subtitle: "Une IA. Du vrai code. Des sites infinis.",
      worksForAnyIndustry: "Fonctionne pour tous les secteurs",
      responsiveOnEveryDevice: "Responsive sur tous les appareils",
      items: [
        {
          title: "Génération de Code IA",
          description:
            "Vrai code React & Tailwind, pas de templates. Chaque site est unique, créé sur mesure par l'IA.",
        },
        {
          title: "Aperçu en Direct",
          description:
            "Voyez les modifications en temps réel pendant que l'IA écrit du code. Comme faire du pair programming avec un développeur senior.",
        },
        {
          title: "N'importe Quel Type de Site",
          description:
            "Landing pages, e-commerce, portfolios, blogs, dashboards — décrivez-le et l'IA le construit.",
        },
        {
          title: "SEO Intégré",
          description:
            "Schema.org, Open Graph, meta tags, sitemap — tout généré automatiquement.",
        },
        {
          title: "Éditeur IA via Chat",
          description:
            "Décrivez les modifications en langage naturel. L'IA comprend le contexte et édite chirurgicalement.",
        },
        {
          title: "Déploiement Instantané",
          description:
            "Un clic pour mettre en ligne. Domaine personnalisé, SSL, CDN — tout inclus.",
        },
      ],
    },
    demo: {
      sectionLabel: "Démo Live",
      title: "Voyez-le en action",
      subtitle: "Entrez le nom d'une entreprise et regardez l'IA construire un site complet en secondes",
      namePlaceholder: "ex. Boulangerie Dupont",
      sectorPlaceholder: "ex. Restaurant, Coiffeur, Dentiste...",
      cityPlaceholder: "ex. Paris",
      cta: "Générer mon site",
      loading: "L'IA est en train de construire...",
      successTitle: "Votre site est prêt!",
      successSubtitle:
        "L'IA a créé en secondes un site complet avec du vrai code React & Tailwind.",
      successNote: "Commencez gratuitement maintenant — sans carte bancaire.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Questions fréquentes",
      items: [
        {
          q: "Ai-je besoin de savoir coder?",
          a: "Pas du tout. Décrivez simplement ce que vous voulez en langage naturel — français, anglais, allemand, n'importe quelle langue. L'IA gère tout le code.",
        },
        {
          q: "Quel type de sites puis-je construire?",
          a: "N'importe quoi : landing pages, sites multipages, boutiques en ligne, portfolios, blogs, systèmes de réservation, dashboards. L'IA écrit du vrai code React — il n'y a pas de limites.",
        },
        {
          q: "Puis-je modifier mon site après l'avoir construit?",
          a: "Oui ! Chattez avec l'IA : 'change la couleur du hero en bleu', 'ajoute une section tarifs', 'agrandis la galerie'. Elle édite le code en temps réel.",
        },
        {
          q: "Quelle est la différence avec Wix ou WordPress?",
          a: "MadeCreative génère du vrai code Next.js — pas des blocs glisser-déposer. Votre site est plus rapide, plus personnalisable et vraiment unique.",
        },
        {
          q: "Qu'en est-il du SEO?",
          a: "Chaque site reçoit du markup Schema.org, des tags Open Graph, des meta descriptions optimisées, du HTML sémantique et un sitemap — tout automatique.",
        },
        {
          q: "Puis-je utiliser mon propre domaine?",
          a: "Oui. Connectez n'importe quel domaine en un clic. Certificat SSL inclus gratuitement.",
        },
        {
          q: "Et si je n'aime pas le résultat?",
          a: "Continuez à chatter ! Dites à l'IA ce qu'il faut changer. Ou revenez à n'importe quelle version précédente en un clic. Plus, garantie satisfait ou remboursé de 14 jours.",
        },
        {
          q: "Combien ça coûte?",
          a: "Le plan Starter est €25/mois avec 100 crédits IA. Growth est €50/mois avec 250 crédits. Pro est €99/mois avec 500 crédits. Sans frais de setup.",
        },
      ],
    },
    finalCta: {
      badge: "Prêt à construire?",
      title: "Votre site est à une conversation de distance",
      subtitle: "Décrivez-le. L'IA le construit. Déploiement en 60 secondes.",
      cta: "Commencer à construire maintenant",
      trustNote: "Sans carte bancaire. Sans contrat. Démarrage immédiat.",
    },
    footer: {
      tagline: "AI website builder. Vrai code. Déploiement instantané.",
      copyright: "© 2026 madecreative.pro — AI website builder.",
      links: {
        privacy: "Politique de Confidentialité",
        cookies: "Politique de Cookies",
        impressum: "Mentions Légales",
        terms: "CGU",
      },
    },
    demoPage: {
      metaTitle: "Démo Live — MadeCreative AI Website Builder",
      metaDescription: "Regardez notre IA écrire du vrai code React & Tailwind en temps réel et construire un site complet.",
      badge: "Démo Live",
      title: "Regardez l'IA",
      titleHighlight: "écrire du code",
      subtitle: "Entrez les données de votre entreprise et regardez notre IA écrire du vrai code Next.js et construire votre site en secondes.",
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
      cta: "Générer mon site",
      terminalSteps: [
        "L'IA analyse votre demande...",
        "Composants React en construction...",
        "Styles Tailwind générés...",
        "Projet Next.js en build...",
        "SEO optimisé...",
      ],
      previewTitle: "Votre site est prêt!",
      previewSubtitle: "L'IA a créé un site complet avec du vrai code React en secondes.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Chargement: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Commencer gratuitement",
      previewCtaNote: "Sans carte bancaire",
      tryAgain: "Réessayer",
    },
    prezziPage: {
      metaTitle: "Tarifs — MadeCreative AI Website Builder",
      metaDescription: "Tarifs transparents sans frais cachés. Starter à partir de €25/mois. Garantie satisfait ou remboursé 14 jours.",
      badge: "Tarifs Transparents",
      title: "Tarifs",
      subtitle: "Commencez gratuitement. Passez au niveau supérieur quand vous êtes prêt. Résiliez quand vous voulez.",
      monthly: "Mensuel",
      annual: "Annuel",
      annualDiscount: "-20%",
      perMonth: "/mois",
      setupFee: "Sans frais de setup",
      mostPopular: "Plus populaire",
      getStarted: "Commencer maintenant",
      moneyBack: "Garantie 14 jours",
      moneyBackTitle: "Garantie satisfait ou remboursé 14 jours",
      moneyBackDesc: "Pas satisfait ? Nous vous remboursons intégralement en 14 jours — sans questions.",
      savingsLabel: "Vous économisez €{n}/an",
      billedAnnually: "Facturé annuellement €{n}/an",
      compareTitle: "Comparaison complète des fonctionnalités",
      faqTitle: "Questions fréquentes",
      tableCategories: {
        website: "Website Builder",
        marketing: "Marketing",
        ai: "IA & Automatisation",
        support: "Support",
      },
      tableFeatures: {
        websites: "Sites web",
        customDomain: "Domaine personnalisé",
        ssl: "Certificat SSL",
        gdpr: "Bannière cookies (RGPD)",
        privacy: "Politique de confidentialité",
        socialPosts: "Crédits IA/mois",
        leads: "Pages",
        seo: "Optimisation SEO",
        googleAds: "Multilingue",
        chatbots: "Chatbot IA",
        automations: "Blog avec articles IA",
        aiAgents: "Dashboard analytics",
        emailSupport: "Support email",
        prioritySupport: "Support prioritaire",
        accountManager: "Account manager",
        phoneSupport: "SLA 99,9%",
      },
      seoBasic: "Basique",
      seoAdvanced: "Avancé",
      seoFull: "Suite complète",
      plans: [
        {
          name: "Starter",
          description: "Parfait pour commencer à construire des sites avec l'IA.",
          features: [
            "AI website builder",
            "100 crédits IA/mois",
            "5 pages",
            "Domaine personnalisé",
            "SSL inclus",
            "Optimisation SEO",
            "Widget WhatsApp",
            "Rapports mensuels",
          ],
        },
        {
          name: "Growth",
          description: "Pour les projets en croissance avec plus de puissance IA et de fonctionnalités.",
          features: [
            "Tout de Starter",
            "250 crédits IA/mois",
            "10 pages",
            "Chatbot IA",
            "Blog avec articles IA",
            "Dashboard analytics",
            "Support prioritaire (4h)",
          ],
        },
        {
          name: "Pro",
          description: "Puissance IA maximale pour les projets professionnels et les agences.",
          features: [
            "Tout de Growth",
            "500 crédits IA/mois",
            "Pages illimitées",
            "3 emplacements",
            "Multilingue",
            "Campagnes email",
            "Account manager",
            "SLA 99,9%",
          ],
        },
      ],
    },
    useCases: {
      sectionLabel: "Pour chaque activité",
      title: "Quelle que soit votre activité —",
      titleHighlight: "MadeCreative la construit.",
      subtitle:
        "Du restaurant familial à la startup en croissance — l'IA comprend votre secteur et génère un site qui correspond à vos besoins spécifiques.",
      ctaNote: "Vous ne voyez pas votre secteur ?",
      ctaLink: "Essayez gratuitement — décrivez ce dont vous avez besoin.",
      items: [
        { name: "Restaurants & Hôtellerie", tagline: "Menus, réservations et ambiance — en ligne en minutes.", description: "Pages de menu, widgets de réservation en ligne, horaires d'ouverture, plans d'accès et galeries. L'IA sait ce dont les restaurants ont besoin et le construit automatiquement.", stats: "Catégorie la plus populaire" },
        { name: "Cabinets Médicaux & Dentaires", tagline: "Sites professionnels auxquels les patients font confiance instantanément.", description: "Formulaires de rendez-vous, descriptions de services, profils de l'équipe, informations sur les mutuelles et FAQ. Entièrement conforme au RGPD par défaut.", stats: "Deuxième plus populaire" },
        { name: "Beauté & Fitness", tagline: "Réservations, tarifs et image de marque — magnifiquement présentés.", description: "Menus de services, planning des cours, galeries avant/après, biographies des instructeurs et réservation en ligne. Mobile-first pour les clients qui réservent en déplacement.", stats: "Segment en forte croissance" },
        { name: "Agences Immobilières", tagline: "Annonces, capture de leads et profils d'agents.", description: "Pages de recherche immobilière, formulaires de contact, annuaires d'agents, guides de quartier et visites virtuelles. Optimisé pour le SEO local.", stats: "Conversions à haute valeur" },
        { name: "Boutiques E-commerce", tagline: "Fiches produits, panier et checkout — conçus pour convertir.", description: "Galeries de produits, pages de catégorie, panier d'achat, intégration Stripe et pages de confirmation de commande. L'IA gère l'intégralité du tunnel d'achat.", stats: "Checkout complet inclus" },
        { name: "Services Professionnels", tagline: "Avocats, experts-comptables, consultants — crédibilité dès le premier jour.", description: "Pages de services, études de cas, biographies de l'équipe, prise de rendez-vous et formulaires de contact. L'IA rédige des textes professionnels qui établissent l'autorité.", stats: "Génération de leads B2B" },
        { name: "Startups & SaaS", tagline: "Pages de lancement qui transforment les visiteurs en inscrits.", description: "Sections hero, comparatifs de fonctionnalités, tableaux de tarifs, témoignages et formulaires de capture d'email. Variantes A/B avec un simple prompt IA.", stats: "Time-to-live le plus rapide" },
        { name: "Portfolios & Créatifs", tagline: "Montrez votre travail. Décrochez des missions. Sans code.", description: "Galeries de projets, pages d'études de cas, sections compétences, formulaires de contact et CV téléchargeables. L'IA met les créatifs en valeur autant que leur travail.", stats: "Plébiscité par les designers" },
      ],
    },
    comparison: {
      sectionLabel: "La comparaison",
      title: "Pourquoi choisir MadeCreative",
      titleHighlight: "plutôt que les alternatives ?",
      subtitle:
        "Wix vous enferme dans son éditeur. WordPress nécessite des plugins, un hébergement et un développeur. Le développement sur mesure coûte des milliers. MadeCreative vous offre du vrai code, la vitesse de l'IA et zéro configuration.",
      headers: { feature: "Fonctionnalité", madecreative: "MadeCreative", wix: "Wix", wordpress: "WordPress", custom: "Dev sur mesure" },
      best: "Le meilleur",
      partial: "Partiel",
      footnote: 'Tarifs et fonctionnalités exacts en avril 2026. "Partiel" signifie que la fonctionnalité nécessite des plugins, une configuration manuelle ou des outils tiers.',
      features: [
        { name: "Génération de code par IA" },
        { name: "Vrai output React / Next.js" },
        { name: "Édition par chat" },
        { name: "Aperçu en direct" },
        { name: "Prix de départ" },
        { name: "Déploiement instantané" },
        { name: "SEO intégré" },
        { name: "Responsive mobile" },
        { name: "Historique des versions" },
        { name: "Aucun code requis" },
        { name: "Vous possédez le code" },
        { name: "Domaine personnalisé + SSL" },
      ],
      highlights: [
        { title: "Le seul AI builder avec un vrai output React" },
        { title: "Pas de plugins. Pas de problèmes d'hébergement. Pas de code." },
        { title: "€25/mois vs €5 000+ pour du dev sur mesure" },
      ],
    },
    testimonials: {
      sectionLabel: "Témoignages clients",
      title: "De vraies entreprises.",
      titleHighlight: "De vrais résultats.",
      subtitle:
        "Des propriétaires de restaurant aux fondateurs de startup — voyez ce qui se passe quand vous remplacez les devis d'agence à €5 000 par une conversation IA de 2 minutes.",
      items: [
        { name: "Marco R.", role: "Propriétaire de restaurant", location: "Milan, Italie", quote: "En 2 minutes j'avais un site qui m'aurait coûté €5 000 chez une agence. J'ai tapé 'crée un site pour ma trattoria à Milan avec des réservations en ligne' et il a construit exactement ça — menu, photos, widget de réservation, tout. Mes clients peuvent désormais réserver directement depuis Google.", result: "Réservations +40% dès le premier mois" },
        { name: "Dr Sarah B.", role: "Propriétaire d'une clinique dentaire", location: "Vienne, Autriche", quote: "L'IA a compris exactement ce dont mon cabinet avait besoin — confiance des patients, design professionnel, prise de rendez-vous et formulaires RGPD-conformes. J'étais inquiète pour le secteur médical mais elle a généré le bon balisage Schema.org et tout était correct. Mes patients commentent toujours à quel point c'est professionnel.", result: "Nouvelles demandes de patients doublées" },
        { name: "Thomas K.", role: "Fondateur de startup", location: "Berlin, Allemagne", quote: "J'ai décrit ma landing page SaaS et elle a construit exactement ce que j'avais en tête — sections features, tableau de tarifs, témoignages, tout. Puis je lui ai demandé d'ajouter un formulaire de liste d'attente et elle l'a fait en 30 secondes. Ce qui aurait pris une semaine à un freelance m'a pris un après-midi. Le code est en plus propre.", result: "€0 dépensé en développement" },
        { name: "Lucia M.", role: "Propriétaire d'un studio de beauté", location: "Barcelone, Espagne", quote: "J'ai zéro connaissance technique et j'avais peur d'essayer. Mais j'ai tapé ce que je voulais et ça a juste fonctionné. Belle galerie, tarifs des services, intégration du fil Instagram, un bouton de réservation. Mes clients me disent que ça semble mieux que celui de mes concurrents qui ont payé des milliers à des agences.", result: "Entièrement en ligne en moins d'1 heure" },
      ],
      stats: [
        { value: "< 2 min", label: "Durée moyenne de construction" },
        { value: "€25/mois", label: "Prix de départ" },
        { value: "95+", label: "Score PageSpeed" },
      ],
      trust: [
        { icon: "★", text: "Note moyenne 4,9/5" },
        { icon: "✓", text: "Aucune carte de crédit requise" },
        { icon: "↺", text: "Résiliez quand vous voulez" },
      ],
    },
  },

  nl: {
    meta: {
      title: "MadeCreative — AI website builder zoals Lovable",
      description:
        "Beschrijf uw website in chat — de AI schrijft echte React & Tailwind-code en toont u een live preview. Geen programmeerkennis nodig. Vanaf €25/maand.",
    },
    nav: {
      howItWorks: "Hoe het werkt",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Gratis starten",
    },
    hero: {
      badge: "AI Website Builder",
      title: "Beschrijf het.",
      titleHighlight: "AI bouwt het.",
      subtitle:
        "Vertel onze AI wat u wilt. Het schrijft echte React & Tailwind-code, toont u een live preview en deployt in seconden. Geen programmeerkennis nodig.",
      cta: "Gratis beginnen met bouwen",
      ctaSecondary: "Zie hoe het werkt",
      trustNote: "Geen creditcard · Gratis plan beschikbaar",
      urlPlaceholder: "Voer uw website-URL in voor een gratis analyse",
      urlCta: "Analyseren",
    },
    howItWorks: {
      sectionLabel: "Hoe Het Werkt",
      title: "Hoe MadeCreative werkt",
      subtitle: "Drie stappen. Nul code. Eindeloze mogelijkheden.",
      steps: [
        {
          number: "01",
          title: "Beschrijf",
          description:
            "Vertel de AI wat u wilt — een restaurantsite, een webshop, een portfolio. Zo gedetailleerd of vaag als u wilt.",
        },
        {
          number: "02",
          title: "Kijk hoe het bouwt",
          description:
            "Onze AI schrijft echte Next.js + Tailwind-code in real-time. U ziet elk aangemaakt bestand, elke gebouwde component — live.",
        },
        {
          number: "03",
          title: "Deploy & bewerk",
          description:
            "Uw website gaat direct live op uw eigen domein. Blijf chatten om wijzigingen aan te brengen — de AI bewerkt elke sectie in seconden.",
        },
      ],
    },
    features: {
      sectionLabel: "Wat Is Inbegrepen",
      title: "Alles wat u nodig heeft",
      subtitle: "Één AI. Echte code. Eindeloze websites.",
      worksForAnyIndustry: "Geschikt voor elke branche",
      responsiveOnEveryDevice: "Responsive op elk apparaat",
      items: [
        {
          title: "AI Code Generatie",
          description:
            "Echte React & Tailwind-code, geen templates. Elke website is uniek, op maat gemaakt door AI.",
        },
        {
          title: "Live Preview",
          description:
            "Zie wijzigingen in real-time terwijl de AI code schrijft. Zoals pair programming met een senior developer.",
        },
        {
          title: "Elk Type Website",
          description:
            "Landing pages, e-commerce, portfolios, blogs, dashboards — beschrijf het en de AI bouwt het.",
        },
        {
          title: "Ingebouwde SEO",
          description:
            "Schema.org, Open Graph, meta tags, sitemap — alles automatisch gegenereerd.",
        },
        {
          title: "AI Chat Editor",
          description:
            "Beschrijf wijzigingen in gewone taal. De AI begrijpt de context en bewerkt precies.",
        },
        {
          title: "Instant Deploy",
          description:
            "Één klik om live te gaan. Eigen domein, SSL, CDN — alles inbegrepen.",
        },
      ],
    },
    demo: {
      sectionLabel: "Live Demo",
      title: "Zie het in actie",
      subtitle: "Voer een bedrijfsnaam in en kijk hoe de AI in seconden een complete website bouwt",
      namePlaceholder: "bijv. Bakkerij De Smid",
      sectorPlaceholder: "bijv. Restaurant, Kapper, Tandarts...",
      cityPlaceholder: "bijv. Amsterdam",
      cta: "Mijn website genereren",
      loading: "AI is aan het bouwen...",
      successTitle: "Uw website is klaar!",
      successSubtitle:
        "De AI heeft in seconden een complete website gebouwd met echte React & Tailwind-code.",
      successNote: "Start nu gratis — geen creditcard nodig.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Veelgestelde vragen",
      items: [
        {
          q: "Heb ik programmeerkennis nodig?",
          a: "Helemaal niet. Beschrijf gewoon wat u wilt in gewone taal — Nederlands, Engels, Duits, welke taal dan ook. De AI regelt alle code.",
        },
        {
          q: "Welk type websites kan ik bouwen?",
          a: "Alles: landing pages, meerdere pagina's, webshops, portfolios, blogs, boekingssystemen, dashboards. De AI schrijft echte React-code — er zijn geen beperkingen.",
        },
        {
          q: "Kan ik mijn website na het bouwen bewerken?",
          a: "Ja! Chat met de AI: 'verander de hero-kleur naar blauw', 'voeg een prijssectie toe', 'maak de galerij groter'. Het bewerkt de code in real-time.",
        },
        {
          q: "Wat is het verschil met Wix of WordPress?",
          a: "MadeCreative genereert echte Next.js-code — geen drag-and-drop blokken. Uw website is sneller, meer aanpasbaar en echt uniek.",
        },
        {
          q: "Hoe zit het met SEO?",
          a: "Elke website krijgt Schema.org-markup, Open Graph-tags, geoptimaliseerde meta-beschrijvingen, semantische HTML en een sitemap — allemaal automatisch.",
        },
        {
          q: "Kan ik mijn eigen domein gebruiken?",
          a: "Ja. Koppel elk domein met één klik. SSL-certificaat gratis inbegrepen.",
        },
        {
          q: "Wat als ik het resultaat niet leuk vind?",
          a: "Blijf chatten! Vertel de AI wat te veranderen. Of ga terug naar een eerdere versie met één klik. Plus: 14 dagen niet-goed-geld-terug-garantie.",
        },
        {
          q: "Hoeveel kost het?",
          a: "Het Starter-plan is €25/maand met 100 AI-credits. Growth is €50/maand met 250 credits. Pro is €99/maand met 500 credits. Geen setupkosten.",
        },
      ],
    },
    finalCta: {
      badge: "Klaar om te bouwen?",
      title: "Uw website is één gesprek verwijderd",
      subtitle: "Beschrijf het. AI bouwt het. Deploy in 60 seconden.",
      cta: "Nu beginnen met bouwen",
      trustNote: "Geen creditcard. Geen contract. Direct starten.",
    },
    footer: {
      tagline: "AI website builder. Echte code. Instant deploy.",
      copyright: "© 2026 madecreative.pro — AI website builder.",
      links: {
        privacy: "Privacybeleid",
        cookies: "Cookiebeleid",
        impressum: "Impressum",
        terms: "Voorwaarden",
      },
    },
    demoPage: {
      metaTitle: "Live Demo — MadeCreative AI Website Builder",
      metaDescription: "Zie onze AI echte React & Tailwind-code schrijven in real-time en een complete website bouwen.",
      badge: "Live Demo",
      title: "Zie de AI",
      titleHighlight: "code schrijven",
      subtitle: "Voer uw bedrijfsgegevens in en zie hoe onze AI echte Next.js-code schrijft en uw website in seconden bouwt.",
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
      cta: "Mijn website genereren",
      terminalSteps: [
        "AI analyseert uw verzoek...",
        "React-componenten worden gebouwd...",
        "Tailwind-stijlen gegenereerd...",
        "Next.js-project in build...",
        "SEO geoptimaliseerd...",
      ],
      previewTitle: "Uw website is klaar!",
      previewSubtitle: "De AI heeft een complete website gebouwd met echte React-code in seconden.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Laadtijd: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Gratis starten",
      previewCtaNote: "Geen creditcard nodig",
      tryAgain: "Opnieuw proberen",
    },
    prezziPage: {
      metaTitle: "Prijzen — MadeCreative AI Website Builder",
      metaDescription: "Transparante prijzen zonder verborgen kosten. Starter vanaf €25/maand. 14 dagen niet-goed-geld-terug-garantie.",
      badge: "Transparante Prijzen",
      title: "Prijzen",
      subtitle: "Start gratis. Upgrade wanneer u klaar bent. Altijd opzegbaar.",
      monthly: "Maandelijks",
      annual: "Jaarlijks",
      annualDiscount: "-20%",
      perMonth: "/maand",
      setupFee: "Geen setupkosten",
      mostPopular: "Meest populair",
      getStarted: "Nu beginnen",
      moneyBack: "14 dagen garantie",
      moneyBackTitle: "14 dagen niet-goed-geld-terug-garantie",
      moneyBackDesc: "Niet tevreden? We vergoeden het volledige bedrag binnen 14 dagen — geen vragen.",
      savingsLabel: "U bespaart €{n}/jaar",
      billedAnnually: "Jaarlijks gefactureerd €{n}/jaar",
      compareTitle: "Volledige functievergelijking",
      faqTitle: "Veelgestelde vragen",
      tableCategories: {
        website: "Website Builder",
        marketing: "Marketing",
        ai: "AI & Automatisering",
        support: "Support",
      },
      tableFeatures: {
        websites: "Websites",
        customDomain: "Eigen domein",
        ssl: "SSL-certificaat",
        gdpr: "Cookiebanner (AVG)",
        privacy: "Privacybeleid",
        socialPosts: "AI-credits/maand",
        leads: "Pagina's",
        seo: "SEO-optimalisatie",
        googleAds: "Meertalig",
        chatbots: "AI-chatbot",
        automations: "Blog met AI-artikelen",
        aiAgents: "Analytics dashboard",
        emailSupport: "E-mailondersteuning",
        prioritySupport: "Prioriteitsondersteuning",
        accountManager: "Account manager",
        phoneSupport: "SLA 99,9%",
      },
      seoBasic: "Basis",
      seoAdvanced: "Geavanceerd",
      seoFull: "Volledige suite",
      plans: [
        {
          name: "Starter",
          description: "Perfect om te beginnen met het bouwen van websites met AI.",
          features: [
            "AI website builder",
            "100 AI-credits/maand",
            "5 pagina's",
            "Eigen domein",
            "SSL inbegrepen",
            "SEO-optimalisatie",
            "WhatsApp-widget",
            "Maandelijkse rapporten",
          ],
        },
        {
          name: "Growth",
          description: "Voor groeiende projecten met meer AI-power en functies.",
          features: [
            "Alles van Starter",
            "250 AI-credits/maand",
            "10 pagina's",
            "AI-chatbot",
            "Blog met AI-artikelen",
            "Analytics dashboard",
            "Prioriteitsondersteuning (4u)",
          ],
        },
        {
          name: "Pro",
          description: "Maximale AI-power voor professionele projecten en bureaus.",
          features: [
            "Alles van Growth",
            "500 AI-credits/maand",
            "Onbeperkte pagina's",
            "3 locaties",
            "Meertalig",
            "E-mailcampagnes",
            "Account manager",
            "SLA 99,9%",
          ],
        },
      ],
    },
    useCases: {
      sectionLabel: "Voor elk bedrijf",
      title: "Wat je bedrijf ook is —",
      titleHighlight: "MadeCreative bouwt het.",
      subtitle:
        "Van het familiérestaurant tot de groeiende startup — de AI begrijpt jouw sector en genereert een site die past bij jouw specifieke behoeften.",
      ctaNote: "Jouw sector er niet bij?",
      ctaLink: "Probeer het gratis — beschrijf wat je nodig hebt.",
      items: [
        { name: "Restaurants & Horeca", tagline: "Menu's, reserveringen en sfeer — live in minuten.", description: "Menupagina's, online reserveringswidgets, openingstijden, kaarten en galeriesecties. De AI weet wat restaurants nodig hebben en bouwt het automatisch.", stats: "Populairste categorie" },
        { name: "Medische & Tandartspraktijken", tagline: "Professionele sites waarop patiënten direct vertrouwen.", description: "Afspraakaanvraagformulieren, servicebeschrijvingen, teamprofielen, verzekeringsinfo en patiënten-FAQ's. Standaard volledig AVG-conform.", stats: "Op één na populairst" },
        { name: "Beauty & Fitness", tagline: "Afspraken, prijzen en merkidentiteit — prachtig gepresenteerd.", description: "Servicemenu's, lesroosters, voor/na-galerijen, instructeursbios en online boeken. Mobile-first voor klanten die onderweg boeken.", stats: "Snelst groeiend segment" },
        { name: "Makelaardij", tagline: "Woningaanbod, leadgeneratie en makelaarsprofíelen.", description: "Woningzoekpagina's, contactformulieren, makelaarsgidsen, buurtgidsen en virtuele rondleidingen. Geoptimaliseerd voor lokale SEO.", stats: "Hoogwaardige conversies" },
        { name: "Webwinkels", tagline: "Productpagina's, winkelwagen en checkout — gebouwd om te converteren.", description: "Productgalerijen, categoriepagina's, winkelwagen, Stripe-integratie en orderbevestigingspagina's. De AI verzorgt de volledige aankoopfunnel.", stats: "Volledige checkout inbegrepen" },
        { name: "Professionele Diensten", tagline: "Advocaten, accountants, consultants — geloofwaardigheid vanaf dag één.", description: "Servicepagina's, casestudy's, teambios, consultatie-afspraken en contactformulieren. De AI schrijft professionele teksten die autoriteit uitstralen.", stats: "B2B-leadgeneratie" },
        { name: "Startups & SaaS", tagline: "Lanceerpagina's die bezoekers omzetten in aanmeldingen.", description: "Hero-secties, functievergelijkingen, prijstabellen, testimonials en e-mailcaptureformulieren. A/B-testvarianten met één AI-prompt.", stats: "Snelste time-to-live" },
        { name: "Portfolio's & Creatieven", tagline: "Laat je werk zien. Krijg opdrachten. Geen code nodig.", description: "Projectgalerijen, casestudy-pagina's, vaardighedensecties, contactformulieren en downloadbare cv's. De AI laat creatieven er net zo goed uitzien als hun werk.", stats: "Geliefd bij designers" },
      ],
    },
    comparison: {
      sectionLabel: "De vergelijking",
      title: "Waarom kiezen voor MadeCreative",
      titleHighlight: "boven de alternatieven?",
      subtitle:
        "Wix sluit je op in hun builder. WordPress heeft plugins, hosting en een developer nodig. Maatwerk dev kost duizenden euro's. MadeCreative geeft je echte code, AI-snelheid en nul configuratie.",
      headers: { feature: "Functie", madecreative: "MadeCreative", wix: "Wix", wordpress: "WordPress", custom: "Maatwerk dev" },
      best: "Beste keuze",
      partial: "Gedeeltelijk",
      footnote: 'Prijzen en functies correct per april 2026. "Gedeeltelijk" betekent dat de functie plugins, handmatige configuratie of tools van derden vereist.',
      features: [
        { name: "AI-codegeneratie" },
        { name: "Echte React / Next.js-output" },
        { name: "Chat-gebaseerde bewerking" },
        { name: "Live preview" },
        { name: "Startprijs" },
        { name: "Direct online" },
        { name: "Ingebouwde SEO" },
        { name: "Mobiel responsive" },
        { name: "Versiegeschiedenis" },
        { name: "Geen code nodig" },
        { name: "Jij bezit de code" },
        { name: "Eigen domein + SSL" },
      ],
      highlights: [
        { title: "Enige AI-builder met echte React-output" },
        { title: "Geen plugins. Geen hosting-gedoe. Geen code." },
        { title: "€25/maand vs €5.000+ voor maatwerk dev" },
      ],
    },
    testimonials: {
      sectionLabel: "Klantverhalen",
      title: "Echte bedrijven.",
      titleHighlight: "Echte resultaten.",
      subtitle:
        "Van restauranteigenaren tot startup-oprichters — ontdek wat er gebeurt als je offertes van €5.000 van agencies vervangt door een AI-gesprek van 2 minuten.",
      items: [
        { name: "Marco R.", role: "Restauranteigenaar", location: "Milaan, Italië", quote: "In 2 minuten had ik een site die me bij een bureau €5.000 had gekost. Ik typte 'bouw een site voor mijn trattoria in Milaan met online reserveringen' en het bouwde precies dat — menu, foto's, boekingswidget, alles. Mijn klanten kunnen nu direct via Google reserveren.", result: "Reserveringen +40% in eerste maand" },
        { name: "Dr. Sarah B.", role: "Eigenaar tandartspraktijk", location: "Wenen, Oostenrijk", quote: "De AI begreep precies wat mijn praktijk nodig had — patiëntenvertrouwen, professioneel design, afsprakenbeheer en AVG-conforme formulieren. Ik maakte me zorgen over de medische sector maar het genereerde correcte Schema.org-markup en alles klopte. Mijn patiënten benoemen altijd hoe professioneel het eruitziet.", result: "Nieuwe patiëntvragen verdubbeld" },
        { name: "Thomas K.", role: "Startup-oprichter", location: "Berlijn, Duitsland", quote: "Ik beschreef mijn SaaS-landingspagina en het bouwde precies wat ik voor ogen had — feature-secties, prijstabel, testimonials, alles. Daarna vroeg ik het om een waitlist-formulier toe te voegen en dat deed het in 30 seconden. Wat een freelancer een week had gekost, kostte mij een middag. De code is ook nog eens schoon.", result: "€0 besteed aan development" },
        { name: "Lucia M.", role: "Eigenaar beautystudio", location: "Barcelona, Spanje", quote: "Ik heb nul technische kennis en was bang om het te proberen. Maar ik typte wat ik wilde en het werkte gewoon. Mooie galerij, serviceprijzen, Instagram-feed-integratie, een boekingsknop. Mijn klanten zeggen me dat het er beter uitziet dan dat van concurrenten die agencies duizenden betaalden.", result: "Volledig live in minder dan 1 uur" },
      ],
      stats: [
        { value: "< 2 min", label: "Gemiddelde bouwtijd" },
        { value: "€25/mnd", label: "Startprijs" },
        { value: "95+", label: "PageSpeed-score" },
      ],
      trust: [
        { icon: "★", text: "4,9/5 gemiddelde beoordeling" },
        { icon: "✓", text: "Geen creditcard nodig" },
        { icon: "↺", text: "Altijd opzegbaar" },
      ],
    },
  },

  pt: {
    meta: {
      title: "MadeCreative — AI website builder como o Lovable",
      description:
        "Descreva o seu site no chat — a IA escreve código React & Tailwind real e mostra-lhe uma preview ao vivo. Sem necessidade de programar. A partir de €25/mês.",
    },
    nav: {
      howItWorks: "Como funciona",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Começar grátis",
    },
    hero: {
      badge: "AI Website Builder",
      title: "Descreva-o.",
      titleHighlight: "A IA constrói-o.",
      subtitle:
        "Diga à nossa IA o que quer. Ela escreve código React & Tailwind real, mostra-lhe uma preview ao vivo e faz o deploy em segundos. Sem necessidade de programar.",
      cta: "Começar a construir grátis",
      ctaSecondary: "Ver como funciona",
      trustNote: "Sem cartão de crédito · Plano gratuito disponível",
      urlPlaceholder: "Introduza o URL do seu site para uma análise gratuita",
      urlCta: "Analisar",
    },
    howItWorks: {
      sectionLabel: "Como Funciona",
      title: "Como funciona o MadeCreative",
      subtitle: "Três passos. Zero código. Infinitas possibilidades.",
      steps: [
        {
          number: "01",
          title: "Descreva",
          description:
            "Diga à IA o que quer — um site de restaurante, uma loja online, um portfolio. Com tantos detalhes quanto quiser ou de forma vaga.",
        },
        {
          number: "02",
          title: "Veja como constrói",
          description:
            "A nossa IA escreve código Next.js + Tailwind real em tempo real. Vê cada ficheiro criado, cada componente construído — ao vivo.",
        },
        {
          number: "03",
          title: "Deploy e edição",
          description:
            "O seu site fica online instantaneamente no seu domínio personalizado. Continue a conversar para fazer alterações — a IA edita qualquer secção em segundos.",
        },
      ],
    },
    features: {
      sectionLabel: "O Que Está Incluído",
      title: "Tudo o que precisa",
      subtitle: "Uma IA. Código real. Sites infinitos.",
      worksForAnyIndustry: "Funciona para qualquer setor",
      responsiveOnEveryDevice: "Responsivo em todos os dispositivos",
      items: [
        {
          title: "Geração de Código IA",
          description:
            "Código React & Tailwind real, não templates. Cada site é único, criado à medida pela IA.",
        },
        {
          title: "Preview ao Vivo",
          description:
            "Veja as alterações em tempo real enquanto a IA escreve código. Como fazer pair programming com um developer sénior.",
        },
        {
          title: "Qualquer Tipo de Site",
          description:
            "Landing pages, e-commerce, portfolios, blogs, dashboards — descreva e a IA constrói.",
        },
        {
          title: "SEO Integrado",
          description:
            "Schema.org, Open Graph, meta tags, sitemap — tudo gerado automaticamente.",
        },
        {
          title: "Editor IA via Chat",
          description:
            "Descreva alterações em linguagem natural. A IA compreende o contexto e edita cirurgicamente.",
        },
        {
          title: "Deploy Instantâneo",
          description:
            "Um clique para ficar online. Domínio personalizado, SSL, CDN — tudo incluído.",
        },
      ],
    },
    demo: {
      sectionLabel: "Demo Ao Vivo",
      title: "Veja em ação",
      subtitle: "Introduza o nome de uma empresa e veja a IA construir um site completo em segundos",
      namePlaceholder: "ex. Pastelaria Rodrigues",
      sectorPlaceholder: "ex. Restaurante, Cabeleireiro, Dentista...",
      cityPlaceholder: "ex. Lisboa",
      cta: "Gerar o meu site",
      loading: "A IA está a construir...",
      successTitle: "O seu site está pronto!",
      successSubtitle:
        "A IA criou em segundos um site completo com código React & Tailwind real.",
      successNote: "Comece grátis agora — sem cartão de crédito.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Perguntas frequentes",
      items: [
        {
          q: "Preciso de saber programar?",
          a: "De forma alguma. Descreva simplesmente o que quer em linguagem natural — português, inglês, alemão, qualquer idioma. A IA trata de todo o código.",
        },
        {
          q: "Que tipo de sites posso construir?",
          a: "Qualquer coisa: landing pages, sites multipágina, lojas online, portfolios, blogs, sistemas de reservas, dashboards. A IA escreve código React real — não há limites.",
        },
        {
          q: "Posso editar o meu site depois de o construir?",
          a: "Sim! Converse com a IA: 'muda a cor do hero para azul', 'adiciona uma secção de preços', 'aumenta a galeria'. Edita o código em tempo real.",
        },
        {
          q: "Qual é a diferença em relação ao Wix ou WordPress?",
          a: "O MadeCreative gera código Next.js real — não blocos de arrastar e largar. O seu site é mais rápido, mais personalizável e verdadeiramente único.",
        },
        {
          q: "E o SEO?",
          a: "Cada site recebe markup Schema.org, tags Open Graph, meta descriptions otimizadas, HTML semântico e um sitemap — tudo automático.",
        },
        {
          q: "Posso usar o meu próprio domínio?",
          a: "Sim. Ligue qualquer domínio com um clique. Certificado SSL incluído gratuitamente.",
        },
        {
          q: "E se não gostar do resultado?",
          a: "Continue a conversar! Diga à IA o que mudar. Ou volte a qualquer versão anterior com um clique. Mais: garantia de devolução do dinheiro de 14 dias.",
        },
        {
          q: "Quanto custa?",
          a: "O plano Starter é €25/mês com 100 créditos IA. Growth é €50/mês com 250 créditos. Pro é €99/mês com 500 créditos. Sem custo de setup.",
        },
      ],
    },
    finalCta: {
      badge: "Pronto para construir?",
      title: "O seu site está a uma conversa de distância",
      subtitle: "Descreva-o. A IA constrói-o. Deploy em 60 segundos.",
      cta: "Começar a construir agora",
      trustNote: "Sem cartão de crédito. Sem contrato. Início imediato.",
    },
    footer: {
      tagline: "AI website builder. Código real. Deploy instantâneo.",
      copyright: "© 2026 madecreative.pro — AI website builder.",
      links: {
        privacy: "Política de Privacidade",
        cookies: "Política de Cookies",
        impressum: "Impressum",
        terms: "Termos",
      },
    },
    demoPage: {
      metaTitle: "Demo Ao Vivo — MadeCreative AI Website Builder",
      metaDescription: "Veja a nossa IA escrever código React & Tailwind real em tempo real e construir um site completo.",
      badge: "Demo Ao Vivo",
      title: "Veja a IA",
      titleHighlight: "a escrever código",
      subtitle: "Introduza os dados da sua empresa e veja a nossa IA escrever código Next.js real e construir o seu site em segundos.",
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
      cta: "Gerar o meu site",
      terminalSteps: [
        "A IA analisa o seu pedido...",
        "Componentes React em construção...",
        "Estilos Tailwind gerados...",
        "Projeto Next.js em build...",
        "SEO otimizado...",
      ],
      previewTitle: "O seu site está pronto!",
      previewSubtitle: "A IA criou um site completo com código React real em segundos.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Carregamento: 1,2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Começar grátis",
      previewCtaNote: "Sem cartão de crédito",
      tryAgain: "Tentar novamente",
    },
    prezziPage: {
      metaTitle: "Preços — MadeCreative AI Website Builder",
      metaDescription: "Preços transparentes sem custos ocultos. Starter a partir de €25/mês. Garantia de devolução 14 dias.",
      badge: "Preços Transparentes",
      title: "Preços",
      subtitle: "Comece grátis. Faça upgrade quando estiver pronto. Cancele quando quiser.",
      monthly: "Mensal",
      annual: "Anual",
      annualDiscount: "-20%",
      perMonth: "/mês",
      setupFee: "Sem custo de setup",
      mostPopular: "Mais popular",
      getStarted: "Começar agora",
      moneyBack: "Garantia 14 dias",
      moneyBackTitle: "Garantia de devolução 14 dias",
      moneyBackDesc: "Não está satisfeito? Reembolsamos o valor total em 14 dias — sem perguntas.",
      savingsLabel: "Poupa €{n}/ano",
      billedAnnually: "Faturado anualmente €{n}/ano",
      compareTitle: "Comparação completa de funcionalidades",
      faqTitle: "Perguntas frequentes",
      tableCategories: {
        website: "Website Builder",
        marketing: "Marketing",
        ai: "IA & Automação",
        support: "Suporte",
      },
      tableFeatures: {
        websites: "Sites web",
        customDomain: "Domínio personalizado",
        ssl: "Certificado SSL",
        gdpr: "Banner de cookies (RGPD)",
        privacy: "Política de privacidade",
        socialPosts: "Créditos IA/mês",
        leads: "Páginas",
        seo: "Otimização SEO",
        googleAds: "Multilingue",
        chatbots: "Chatbot IA",
        automations: "Blog com artigos IA",
        aiAgents: "Dashboard analytics",
        emailSupport: "Suporte email",
        prioritySupport: "Suporte prioritário",
        accountManager: "Account manager",
        phoneSupport: "SLA 99,9%",
      },
      seoBasic: "Básico",
      seoAdvanced: "Avançado",
      seoFull: "Suite completa",
      plans: [
        {
          name: "Starter",
          description: "Perfeito para começar a construir sites com IA.",
          features: [
            "AI website builder",
            "100 créditos IA/mês",
            "5 páginas",
            "Domínio personalizado",
            "SSL incluído",
            "Otimização SEO",
            "Widget WhatsApp",
            "Relatórios mensais",
          ],
        },
        {
          name: "Growth",
          description: "Para projetos em crescimento com mais potência IA e funcionalidades.",
          features: [
            "Tudo de Starter",
            "250 créditos IA/mês",
            "10 páginas",
            "Chatbot IA",
            "Blog com artigos IA",
            "Dashboard analytics",
            "Suporte prioritário (4h)",
          ],
        },
        {
          name: "Pro",
          description: "Máxima potência IA para projetos profissionais e agências.",
          features: [
            "Tudo de Growth",
            "500 créditos IA/mês",
            "Páginas ilimitadas",
            "3 localizações",
            "Multilingue",
            "Campanhas email",
            "Account manager",
            "SLA 99,9%",
          ],
        },
      ],
    },
    useCases: {
      sectionLabel: "Para cada negócio",
      title: "Seja qual for o seu negócio —",
      titleHighlight: "MadeCreative constrói.",
      subtitle:
        "Do restaurante familiar à startup em crescimento — a IA entende o seu setor e gera um site que corresponde às suas necessidades específicas.",
      ctaNote: "Não encontrou o seu setor?",
      ctaLink: "Experimente grátis — descreva o que precisa.",
      items: [
        { name: "Restaurantes & Hotelaria", tagline: "Menus, reservas e ambiente — online em minutos.", description: "Páginas de menu, widgets de reserva online, horários, mapas e galerias. A IA sabe o que os restaurantes precisam e constrói automaticamente.", stats: "Categoria mais popular" },
        { name: "Clínicas Médicas & Dentárias", tagline: "Sites profissionais em que os pacientes confiam imediatamente.", description: "Formulários de marcação, descrições de serviços, perfis da equipa, informações de seguros e FAQs. Totalmente conforme ao RGPD por defeito.", stats: "Segunda mais popular" },
        { name: "Beleza & Fitness", tagline: "Reservas, preços e marca — apresentados de forma deslumbrante.", description: "Menus de serviços, horários de aulas, galerias antes/depois, biografias de instrutores e marcação online. Mobile-first para clientes que marcam em movimento.", stats: "Segmento em crescimento acelerado" },
        { name: "Agências Imobiliárias", tagline: "Listagens de imóveis, captação de leads e perfis de agentes.", description: "Páginas de pesquisa de imóveis, formulários de contacto, diretórios de agentes, guias de bairros e visitas virtuais. Otimizado para SEO local.", stats: "Conversões de alto valor" },
        { name: "Lojas E-commerce", tagline: "Páginas de produto, carrinho e checkout — construídos para converter.", description: "Galerias de produtos, páginas de categoria, carrinho de compras, integração Stripe e páginas de confirmação de encomenda. A IA gere todo o funil de compra.", stats: "Checkout completo incluído" },
        { name: "Serviços Profissionais", tagline: "Advogados, contabilistas, consultores — credibilidade desde o primeiro dia.", description: "Páginas de serviços, casos de estudo, biografias da equipa, marcação de consultas e formulários de contacto. A IA escreve textos profissionais que estabelecem autoridade.", stats: "Geração de leads B2B" },
        { name: "Startups & SaaS", tagline: "Páginas de lançamento que convertem visitantes em registos.", description: "Secções hero, comparativos de funcionalidades, tabelas de preços, testemunhos e formulários de captação de email. Variantes A/B com um único prompt de IA.", stats: "Time-to-live mais rápido" },
        { name: "Portfólios & Criativos", tagline: "Mostre o seu trabalho. Consiga clientes. Sem código.", description: "Galerias de projetos, páginas de casos de estudo, secções de competências, formulários de contacto e CVs para download. A IA faz os criativos parecerem tão bons quanto o seu trabalho.", stats: "Adorado por designers" },
      ],
    },
    comparison: {
      sectionLabel: "A comparação",
      title: "Por que escolher o MadeCreative",
      titleHighlight: "em vez das alternativas?",
      subtitle:
        "O Wix prende-o ao seu construtor. O WordPress precisa de plugins, alojamento e um developer. O desenvolvimento personalizado custa milhares. O MadeCreative dá-lhe código real, velocidade de IA e zero configuração.",
      headers: { feature: "Funcionalidade", madecreative: "MadeCreative", wix: "Wix", wordpress: "WordPress", custom: "Dev personalizado" },
      best: "A melhor opção",
      partial: "Parcial",
      footnote: 'Preços e funcionalidades corretos em abril de 2026. "Parcial" indica que a funcionalidade requer plugins, configuração manual ou ferramentas de terceiros.',
      features: [
        { name: "Geração de código por IA" },
        { name: "Output React / Next.js real" },
        { name: "Edição por chat" },
        { name: "Pré-visualização em tempo real" },
        { name: "Preço de entrada" },
        { name: "Deploy instantâneo" },
        { name: "SEO integrado" },
        { name: "Responsivo em mobile" },
        { name: "Histórico de versões" },
        { name: "Sem código necessário" },
        { name: "Você é dono do código" },
        { name: "Domínio personalizado + SSL" },
      ],
      highlights: [
        { title: "O único AI builder com output React real" },
        { title: "Sem plugins. Sem complicações de alojamento. Sem código." },
        { title: "€25/mês vs €5.000+ em dev personalizado" },
      ],
    },
    testimonials: {
      sectionLabel: "Histórias de clientes",
      title: "Negócios reais.",
      titleHighlight: "Resultados reais.",
      subtitle:
        "De donos de restaurantes a fundadores de startups — veja o que acontece quando substitui orçamentos de €5.000 de agências por uma conversa de 2 minutos com IA.",
      items: [
        { name: "Marco R.", role: "Dono de restaurante", location: "Milão, Itália", quote: "Em 2 minutos tinha um site que teria custado €5.000 numa agência. Escrevi 'cria um site para a minha trattoria em Milão com reservas online' e construiu exatamente isso — menu, fotos, widget de reservas, tudo. Os meus clientes já conseguem reservar diretamente pelo Google.", result: "Reservas +40% no primeiro mês" },
        { name: "Dra. Sarah B.", role: "Proprietária de clínica dentária", location: "Viena, Áustria", quote: "A IA percebeu exatamente o que a minha clínica precisava — confiança dos pacientes, design profissional, marcação de consultas e formulários conformes ao RGPD. Estava preocupada com o setor médico mas gerou o markup Schema.org correto e estava tudo certo. Os meus pacientes comentam sempre como parece profissional.", result: "Novos pedidos de pacientes duplicaram" },
        { name: "Thomas K.", role: "Fundador de startup", location: "Berlim, Alemanha", quote: "Descrevi a minha landing page SaaS e construiu exatamente o que tinha em mente — secções de features, tabela de preços, testemunhos, tudo. Depois pedi para adicionar um formulário de lista de espera e fez isso em 30 segundos. O que teria levado uma semana a um freelancer levou-me uma tarde. O código até está limpo.", result: "€0 gastos em desenvolvimento" },
        { name: "Lucia M.", role: "Proprietária de estúdio de beleza", location: "Barcelona, Espanha", quote: "Tenho zero conhecimentos técnicos e tinha medo de tentar. Mas escrevi o que queria e simplesmente funcionou. Galeria linda, preços dos serviços, integração do feed do Instagram, um botão de reserva. Os meus clientes dizem-me que parece melhor do que o dos meus concorrentes que pagaram milhares a agências.", result: "Totalmente online em menos de 1 hora" },
      ],
      stats: [
        { value: "< 2 min", label: "Tempo médio de construção" },
        { value: "€25/mês", label: "Preço de entrada" },
        { value: "95+", label: "Pontuação PageSpeed" },
      ],
      trust: [
        { icon: "★", text: "Avaliação média 4,9/5" },
        { icon: "✓", text: "Sem cartão de crédito" },
        { icon: "↺", text: "Cancele quando quiser" },
      ],
    },
  },

  en: {
    meta: {
      title: "MadeCreative — AI website builder like Lovable",
      description:
        "Describe your website in chat — AI writes real React & Tailwind code and shows you a live preview. No coding skills needed. From €25/month.",
    },
    nav: {
      howItWorks: "How it works",
      demo: "Demo",
      faq: "FAQ",
      startFree: "Start free",
    },
    hero: {
      badge: "AI-Powered Website Builder",
      title: "Describe it.",
      titleHighlight: "AI builds it.",
      subtitle:
        "Tell our AI what you want. It writes real React & Tailwind code, shows you a live preview, and deploys in seconds. No coding needed.",
      cta: "Start Building Free",
      ctaSecondary: "Watch it work",
      trustNote: "No credit card required · Free plan available",
      urlPlaceholder: "Enter your website URL for a free analysis",
      urlCta: "Analyze",
    },
    howItWorks: {
      sectionLabel: "How It Works",
      title: "How MadeCreative works",
      subtitle: "Three steps. Zero code. Infinite possibilities.",
      steps: [
        {
          number: "01",
          title: "Describe",
          description:
            "Tell the AI what you want — a restaurant site, an e-commerce store, a portfolio. Be as detailed or vague as you like.",
        },
        {
          number: "02",
          title: "Watch it build",
          description:
            "Our AI writes real Next.js + Tailwind code in real-time. You see every file created, every component built — live.",
        },
        {
          number: "03",
          title: "Deploy & edit",
          description:
            "Your site goes live instantly on your custom domain. Keep chatting to make changes — the AI edits any section in seconds.",
        },
      ],
    },
    features: {
      sectionLabel: "What's Included",
      title: "Everything you need",
      subtitle: "One AI. Real code. Infinite websites.",
      worksForAnyIndustry: "Works for any industry",
      responsiveOnEveryDevice: "Responsive on every device",
      items: [
        {
          title: "AI Code Generation",
          description:
            "Real React & Tailwind code, not templates. Every site is unique, hand-crafted by AI.",
        },
        {
          title: "Live Preview",
          description:
            "See changes in real-time as the AI writes code. Like pair programming with a senior developer.",
        },
        {
          title: "Any Type of Site",
          description:
            "Landing pages, e-commerce, portfolios, blogs, dashboards — describe it and it builds it.",
        },
        {
          title: "Built-in SEO",
          description:
            "Schema.org, Open Graph, meta tags, sitemap — all generated automatically.",
        },
        {
          title: "AI Chat Editor",
          description:
            "Describe changes in plain language. The AI understands context and edits surgically.",
        },
        {
          title: "Instant Deploy",
          description:
            "One click to go live. Custom domain, SSL, CDN — all included.",
        },
      ],
    },
    demo: {
      sectionLabel: "Live Demo",
      title: "See it in action",
      subtitle: "Enter a business name and watch AI build a complete website in seconds",
      namePlaceholder: "e.g. Smith's Bakery",
      sectorPlaceholder: "e.g. Restaurant, Hair Salon, Dentist...",
      cityPlaceholder: "e.g. London",
      cta: "Generate my site",
      loading: "AI is building...",
      successTitle: "Your site is ready!",
      successSubtitle:
        "The AI built a complete website with real React & Tailwind code in seconds.",
      successNote: "Start free now — no credit card required.",
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Frequently asked questions",
      items: [
        {
          q: "Do I need coding skills?",
          a: "Not at all. Just describe what you want in plain language — Italian, English, German, any language. The AI handles all the code.",
        },
        {
          q: "What kind of sites can I build?",
          a: "Anything: landing pages, multi-page websites, e-commerce stores, portfolios, blogs, booking systems, dashboards. The AI writes real React code — there are no limits.",
        },
        {
          q: "Can I edit my site after it's built?",
          a: "Yes! Just chat with the AI: 'change the hero color to blue', 'add a pricing section', 'make the gallery bigger'. It edits the code in real-time.",
        },
        {
          q: "How is this different from Wix or WordPress?",
          a: "MadeCreative generates real Next.js code — not drag-and-drop blocks. Your site is faster, more customizable, and truly unique.",
        },
        {
          q: "What about SEO?",
          a: "Every site gets Schema.org markup, Open Graph tags, optimized meta descriptions, semantic HTML, and a sitemap — all automatic.",
        },
        {
          q: "Can I use my own domain?",
          a: "Yes. Connect any domain with one click. SSL certificate included free.",
        },
        {
          q: "What if I don't like the result?",
          a: "Keep chatting! Tell the AI what to change. Or undo to any previous version with one click. Plus, 14-day money-back guarantee.",
        },
        {
          q: "How much does it cost?",
          a: "Starter plan is €25/month with 100 AI credits. Growth is €50/month with 250 credits. Pro is €99/month with 500 credits. No setup fee.",
        },
      ],
    },
    finalCta: {
      badge: "Ready to build?",
      title: "Your website is one conversation away",
      subtitle: "Describe it. AI builds it. Deploy in 60 seconds.",
      cta: "Start Building Now",
      trustNote: "No credit card. No contract. Instant start.",
    },
    footer: {
      tagline: "AI website builder. Real code. Instant deploy.",
      copyright: "© 2026 madecreative.pro — AI website builder.",
      links: {
        privacy: "Privacy Policy",
        cookies: "Cookie Policy",
        impressum: "Impressum",
        terms: "Terms",
      },
    },
    demoPage: {
      metaTitle: "Live Demo — MadeCreative AI Website Builder",
      metaDescription: "Watch our AI write real React & Tailwind code in real-time and build a complete website.",
      badge: "Live Demo",
      title: "Watch the AI",
      titleHighlight: "write code",
      subtitle: "Enter your business details and watch our AI write real Next.js code and build your website in seconds.",
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
      cta: "Generate my site",
      terminalSteps: [
        "AI analysing your request...",
        "React components being built...",
        "Tailwind styles generated...",
        "Next.js project in build...",
        "SEO optimised...",
      ],
      previewTitle: "Your site is ready!",
      previewSubtitle: "The AI built a complete website with real React code in seconds.",
      statsLighthouse: "Lighthouse: 94/100",
      statsLoad: "Load time: 1.2s",
      statsMobile: "Mobile-ready: ✓",
      previewCta: "Start free",
      previewCtaNote: "No credit card required",
      tryAgain: "Try again",
    },
    prezziPage: {
      metaTitle: "Pricing — MadeCreative AI Website Builder",
      metaDescription: "Transparent pricing with no hidden fees. Starter from €25/month. 14-day money-back guarantee.",
      badge: "Transparent Pricing",
      title: "Pricing",
      subtitle: "Start free. Upgrade when you're ready. Cancel anytime.",
      monthly: "Monthly",
      annual: "Annual",
      annualDiscount: "-20%",
      perMonth: "/month",
      setupFee: "No setup fee",
      mostPopular: "Most popular",
      getStarted: "Get started",
      moneyBack: "14-day guarantee",
      moneyBackTitle: "14-day money-back guarantee",
      moneyBackDesc: "Not happy? We'll refund you in full within 14 days — no questions asked.",
      savingsLabel: "You save €{n}/year",
      billedAnnually: "Billed annually €{n}/year",
      compareTitle: "Full feature comparison",
      faqTitle: "Frequently asked questions",
      tableCategories: {
        website: "Website Builder",
        marketing: "Marketing",
        ai: "AI & Automation",
        support: "Support",
      },
      tableFeatures: {
        websites: "Websites",
        customDomain: "Custom domain",
        ssl: "SSL certificate",
        gdpr: "Cookie banner (GDPR)",
        privacy: "Privacy policy",
        socialPosts: "AI credits/month",
        leads: "Pages",
        seo: "SEO optimisation",
        googleAds: "Multilingual",
        chatbots: "AI chatbot",
        automations: "Blog with AI articles",
        aiAgents: "Analytics dashboard",
        emailSupport: "Email support",
        prioritySupport: "Priority support",
        accountManager: "Account manager",
        phoneSupport: "99.9% SLA",
      },
      seoBasic: "Basic",
      seoAdvanced: "Advanced",
      seoFull: "Full suite",
      plans: [
        {
          name: "Starter",
          description: "Perfect for getting started with AI website building.",
          features: [
            "AI website builder",
            "100 AI credits/month",
            "5 pages",
            "Custom domain",
            "SSL included",
            "SEO optimisation",
            "WhatsApp widget",
            "Monthly reports",
          ],
        },
        {
          name: "Growth",
          description: "For growing projects with more AI power and features.",
          features: [
            "Everything in Starter",
            "250 AI credits/month",
            "10 pages",
            "AI chatbot",
            "Blog with AI articles",
            "Analytics dashboard",
            "Priority support (4h)",
          ],
        },
        {
          name: "Pro",
          description: "Maximum AI power for professional projects and agencies.",
          features: [
            "Everything in Growth",
            "500 AI credits/month",
            "Unlimited pages",
            "3 locations",
            "Multilingual",
            "Email campaigns",
            "Account manager",
            "99.9% SLA",
          ],
        },
      ],
    },
    useCases: {
      sectionLabel: "Built for every business",
      title: "Whatever your business —",
      titleHighlight: "MadeCreative builds it.",
      subtitle:
        "From a family restaurant to a Series A startup — the AI understands your industry and generates a site that matches your specific needs, audience, and goals.",
      ctaNote: "Don't see your industry?",
      ctaLink: "Try it free — describe what you need.",
      items: [
        { name: "Restaurants & Hospitality", tagline: "Menus, reservations, and ambiance — live in minutes.", description: "Menu pages, online booking widgets, opening hours, location maps, and gallery sections. The AI knows what restaurants need and builds it automatically.", stats: "Most popular category" },
        { name: "Medical & Dental Clinics", tagline: "Professional sites patients trust instantly.", description: "Appointment booking forms, service descriptions, team profiles, insurance info, and patient FAQs. Fully GDPR-compliant by default.", stats: "2nd most popular" },
        { name: "Beauty & Fitness Studios", tagline: "Bookings, pricing, and brand — beautifully presented.", description: "Service menus, class schedules, before/after galleries, instructor bios, and online booking. Mobile-first for clients booking on the go.", stats: "Fast growing segment" },
        { name: "Real Estate Agencies", tagline: "Property listings, lead capture, and agent profiles.", description: "Property search pages, contact forms, agent directories, neighborhood guides, and virtual tour embeds. Optimized for local SEO.", stats: "High-ticket conversions" },
        { name: "E-commerce Stores", tagline: "Product pages, cart flows, and checkout — built to convert.", description: "Product galleries, category pages, shopping cart, Stripe integration, and order confirmation pages. The AI handles the full purchase funnel.", stats: "Full checkout included" },
        { name: "Professional Services", tagline: "Law firms, accountants, consultants — credibility on day one.", description: "Service pages, case studies, team bios, consultation booking, and contact forms. The AI writes professional copy that establishes authority.", stats: "B2B lead generation" },
        { name: "Startups & SaaS", tagline: "Launch pages that convert visitors into signups.", description: "Hero sections, feature comparisons, pricing tables, testimonials, and email capture forms. A/B test variants with a single AI prompt.", stats: "Fastest time-to-live" },
        { name: "Portfolios & Creatives", tagline: "Show your work. Get hired. No code needed.", description: "Project galleries, case study pages, skills sections, contact forms, and downloadable CVs. The AI makes creatives look as good as their work.", stats: "Loved by designers" },
      ],
    },
    comparison: {
      sectionLabel: "How we compare",
      title: "Why choose MadeCreative",
      titleHighlight: "over the alternatives?",
      subtitle:
        "Wix locks you into their builder. WordPress needs plugins, hosting, and a developer. Custom dev costs thousands. MadeCreative gives you real code, AI speed, and zero setup.",
      headers: { feature: "Feature", madecreative: "MadeCreative", wix: "Wix", wordpress: "WordPress", custom: "Custom Dev" },
      best: "Best",
      partial: "Partial",
      footnote: 'Pricing and features accurate as of April 2026. "Partial" indicates the feature requires plugins, manual setup, or third-party tools.',
      features: [
        { name: "AI code generation" },
        { name: "Real React / Next.js output" },
        { name: "Chat-based editing" },
        { name: "Live preview" },
        { name: "Starting price" },
        { name: "Instant deploy" },
        { name: "Built-in SEO" },
        { name: "Mobile responsive" },
        { name: "Version history" },
        { name: "No code required" },
        { name: "You own the code" },
        { name: "Custom domain + SSL" },
      ],
      highlights: [
        { title: "Only AI builder with real React output" },
        { title: "No plugins. No hosting headaches. No code." },
        { title: "€25/mo vs €5,000+ for custom dev" },
      ],
    },
    testimonials: {
      sectionLabel: "Customer stories",
      title: "Real businesses.",
      titleHighlight: "Real results.",
      subtitle:
        "From restaurant owners to startup founders — see what happens when you replace €5,000 agency quotes with a 2-minute AI conversation.",
      items: [
        { name: "Marco R.", role: "Restaurant Owner", location: "Milan, Italy", quote: "In 2 minutes I had a site that would have cost me €5,000 with an agency. I typed 'build a site for my trattoria in Milan with online reservations' and it built exactly that — menu, photos, booking widget, everything. My customers can book directly from Google now.", result: "Reservations up 40% in first month" },
        { name: "Dr. Sarah B.", role: "Dental Clinic Owner", location: "Vienna, Austria", quote: "The AI understood exactly what my practice needed — patient trust, professional design, appointment booking, and GDPR-compliant forms. I was worried about the medical sector but it generated proper Schema.org markup and everything was correct. My patients comment on how professional it looks.", result: "New patient inquiries doubled" },
        { name: "Thomas K.", role: "Startup Founder", location: "Berlin, Germany", quote: "I described my SaaS landing page and it built exactly what I had in mind — feature sections, pricing table, testimonials, the works. I then asked it to add a waitlist form and it did it in 30 seconds. What would have taken a freelancer a week took me one afternoon. The code is actually clean too.", result: "€0 spent on development" },
        { name: "Lucia M.", role: "Beauty Studio Owner", location: "Barcelona, Spain", quote: "I have zero technical knowledge and I was scared to try. But I typed what I wanted and it just worked. Beautiful gallery, service prices, Instagram feed integration, a booking button. My clients tell me it looks better than my competitors who paid agencies thousands.", result: "Fully live in under 1 hour" },
      ],
      stats: [
        { value: "< 2 min", label: "Average build time" },
        { value: "€25/mo", label: "Starting price" },
        { value: "95+", label: "PageSpeed score" },
      ],
      trust: [
        { icon: "★", text: "4.9/5 average rating" },
        { icon: "✓", text: "No credit card required" },
        { icon: "↺", text: "Cancel anytime" },
      ],
    },
  },
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}
