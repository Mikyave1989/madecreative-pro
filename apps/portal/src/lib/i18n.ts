"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Locale types ─────────────────────────────────────────────────────────────

export type Locale = "de" | "en" | "it" | "es" | "fr" | "nl" | "pt";

export const SUPPORTED_LOCALES: Locale[] = ["de", "en", "it", "es", "fr", "nl", "pt"];
export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  it: "Italiano",
  es: "Español",
  fr: "Français",
  nl: "Nederlands",
  pt: "Português",
};
export const LOCALE_FLAGS: Record<Locale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  it: "🇮🇹",
  es: "🇪🇸",
  fr: "🇫🇷",
  nl: "🇳🇱",
  pt: "🇧🇷",
};

const STORAGE_KEY = "madecreative_locale";

// ─── Translation interface ────────────────────────────────────────────────────

export interface Translations {
  // ── Common ──────────────────────────────────────────────────────────────────
  common: {
    loading: string;
    error: string;
    retry: string;
    save: string;
    cancel: string;
    close: string;
    back: string;
    next: string;
    confirm: string;
    delete: string;
    edit: string;
    copy: string;
    copied: string;
    search: string;
    noData: string;
    yes: string;
    no: string;
    optional: string;
    learnMore: string;
    dataUnavailable: string;
  };

  // ── Layout ───────────────────────────────────────────────────────────────────
  layout: {
    loadingApp: string;
  };

  // ── Sidebar navigation ───────────────────────────────────────────────────────
  nav: {
    dashboard: string;
    editor: string;
    chatbot: string;
    reports: string;
    settings: string;
    billing: string;
    website: string;
    templates: string;
    logout: string;
  };

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    account: string;
    profile: string;
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  login: {
    pageTitle: string;
    tagline: string;
    heroHeadline: string;
    heroSubtitle: string;
    heroStatClients: string;
    heroStatLeads: string;
    heroStatUptime: string;
    heroStatSatisfaction: string;
    clientPortal: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    submitButton: string;
    supportText: string;
    supportLink: string;
    showPassword: string;
    hidePassword: string;
    invalidCredentials: string;
    welcomeBack: string;
  };

  // ── Signup ───────────────────────────────────────────────────────────────────
  signup: {
    pageTitle: string;
    heroHeadlineA: string;
    heroHeadlineB: string;
    heroHeadlineHighlight: string;
    heroSubtitle: string;
    heroStatSites: string;
    heroStatTime: string;
    heroStatUptime: string;
    heroStatSatisfaction: string;
    formTitle: string;
    formSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    websiteLabel: string;
    websitePlaceholder: string;
    submitButton: string;
    alreadyHaveAccount: string;
    signIn: string;
    errorDefault: string;
    plan: string;
  };

  // ── Dashboard ────────────────────────────────────────────────────────────────
  dashboard: {
    greeting: string;
    overview: string;
    yourSite: string;
    siteNotGenerated: string;
    statusLive: string;
    statusPreparation: string;
    editSite: string;
    visitsPerMonth: string;
    lighthouse: string;
    conversations: string;
    resolutionRate: string;
    monthlyReports: string;
    seeAll: string;
    noReportsYet: string;
    inPreparation: string;
    account: string;
    status: string;
    statusActive: string;
    sector: string;
    clientSince: string;
    manageAccount: string;
    errorDashboard: string;
  };

  // ── Editor ───────────────────────────────────────────────────────────────────
  editor: {
    // Top bar
    projectName: string;
    tabCode: string;
    tabPreview: string;
    shareButton: string;
    copiedButton: string;
    publishButton: string;
    // Chat panel
    chatTitle: string;
    emptyStateHeadline: string;
    emptyStateSubtitle: string;
    suggestionRestaurant: string;
    suggestionEcommerce: string;
    suggestionLanding: string;
    suggestionPortfolio: string;
    inputPlaceholder: string;
    // File tree
    explorerLabel: string;
    noFiles: string;
    selectFileHint: string;
    // Tool badge labels
    toolWrite: string;
    toolEdit: string;
    toolRead: string;
    toolPhotos: string;
    // Preview bar
    previewDomain: string;
    // Error messages
    errorConnection: string;
    errorGeneric: string;
    loadingPreview: string;
  };

  // ── Billing ───────────────────────────────────────────────────────────────────
  billing: {
    pageTitle: string;
    pageSubtitle: string;
    aiCredits: string;
    creditsRemaining: string;
    creditPercent: string;
    extraCreditsLabel: string;
    buyExtraCredits: string;
    costChat: string;
    costSimpleEdit: string;
    costComplexEdit: string;
    costOpus: string;
    credits: string;
    currentPlan: string;
    perMonth: string;
    subscriptionActive: string;
    nextCharge: string;
    invoiceHistory: string;
    noInvoices: string;
    invoiceDate: string;
    invoiceDescription: string;
    invoiceAmount: string;
    invoiceStatus: string;
    statusPaid: string;
    statusPending: string;
    statusFailed: string;
    paymentMethod: string;
    noPaymentMethod: string;
    manageOnStripe: string;
    accountInfo: string;
    clientSince: string;
    plan: string;
    pageOf: string;
    expires: string;
    addedCreditsSuccess: string;
    errorBuyCredits: string;
    errorBilling: string;
  };

  // ── Settings ──────────────────────────────────────────────────────────────────
  settings: {
    pageTitle: string;
    pageSubtitle: string;
    customDomain: string;
    customDomainDesc: string;
    domainPlaceholder: string;
    connectButton: string;
    configureDns: string;
    configureDnsDesc: string;
    domainVerified: string;
    domainPending: string;
    noCustomDomain: string;
    integrationsTitle: string;
    integrationsDesc: string;
    connectorConnected: string;
    connectorNotConnected: string;
    getKeyLink: string;
    saveSetting: string;
    connDescAnalytics: string;
    connDescMaps: string;
    connDescMeta: string;
    connDescEmail: string;
    connDescChat: string;
    connDescSsl: string;
    connEmailPlaceholder: string;
    connEmailLabel: string;
    errorDomain: string;
  };

  // ── Reports ────────────────────────────────────────────────────────────────────
  reports: {
    pageTitle: string;
    pageSubtitle: string;
    noReports: string;
    generateNow: string;
    websiteVisits: string;
    leads: string;
    conversions: string;
    chatbot: string;
    timeSaved: string;
    insights: string;
    recommendations: string;
    goals: string;
    downloadPdf: string;
    viewReport: string;
    generating: string;
    sentOn: string;
    inPreparation: string;
  };

  // ── Onboarding ──────────────────────────────────────────────────────────────────
  onboarding: {
    welcome: string;
    step: string;
    of: string;
    next: string;
    finish: string;
    skip: string;
  };
}

// ─── Translation data ─────────────────────────────────────────────────────────

const translations: Record<Locale, Translations> = {
  // ────────────────────────────────────────────────────────────────────────────
  // GERMAN — formal "Sie"
  // ────────────────────────────────────────────────────────────────────────────
  de: {
    common: {
      loading: "Wird geladen...",
      error: "Fehler",
      retry: "Erneut versuchen",
      save: "Speichern",
      cancel: "Abbrechen",
      close: "Schließen",
      back: "Zurück",
      next: "Weiter",
      confirm: "Bestätigen",
      delete: "Löschen",
      edit: "Bearbeiten",
      copy: "Kopieren",
      copied: "Kopiert",
      search: "Suchen",
      noData: "Keine Daten verfügbar",
      yes: "Ja",
      no: "Nein",
      optional: "optional",
      learnMore: "Mehr erfahren",
      dataUnavailable: "Daten nicht verfügbar",
    },
    layout: {
      loadingApp: "Wird geladen...",
    },
    nav: {
      dashboard: "Dashboard",
      editor: "Editor",
      chatbot: "Chatbot",
      reports: "Berichte",
      settings: "Einstellungen",
      billing: "Abrechnung",
      website: "Website",
      templates: "Vorlagen",
      logout: "Abmelden",
    },
    header: {
      account: "Konto",
      profile: "Profil",
    },
    login: {
      pageTitle: "Anmelden",
      tagline: "Ihr digitaler Partner",
      heroHeadline: "Ihre digitale Präsenz,\nvoll im Griff.",
      heroSubtitle: "Besuche, Leads, Chatbot und Abrechnung — alles in einem Übersichtspanel.",
      heroStatClients: "Aktive Kunden",
      heroStatLeads: "Generierte Leads",
      heroStatUptime: "Verfügbarkeit",
      heroStatSatisfaction: "Zufriedenheit",
      clientPortal: "Kundenportal",
      emailLabel: "E-Mail-Adresse",
      emailPlaceholder: "sie@unternehmen.de",
      passwordLabel: "Passwort",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Passwort vergessen?",
      submitButton: "Anmelden",
      supportText: "Probleme beim Anmelden?",
      supportLink: "Support kontaktieren",
      showPassword: "Passwort anzeigen",
      hidePassword: "Passwort verbergen",
      invalidCredentials: "Ungültige Anmeldedaten",
      welcomeBack: "Willkommen zurück",
    },
    signup: {
      pageTitle: "Registrieren",
      heroHeadlineA: "Erstellen Sie Ihre Website",
      heroHeadlineB: "in",
      heroHeadlineHighlight: "60 Sekunden",
      heroSubtitle: "Registrierung abschließen, um Ihren Plan zu aktivieren.",
      heroStatSites: "Erstellte Websites",
      heroStatTime: "Durchschnittszeit",
      heroStatUptime: "Verfügbarkeit",
      heroStatSatisfaction: "Zufriedenheit",
      formTitle: "Registrieren — Plan",
      formSubtitle: "Registrierung abschließen, um zur Zahlung fortzufahren",
      emailLabel: "E-Mail-Adresse",
      emailPlaceholder: "sie@unternehmen.de",
      companyLabel: "Unternehmensname",
      companyPlaceholder: "Ihr Unternehmen",
      websiteLabel: "Website-URL",
      websitePlaceholder: "https://www.beispiel.de",
      submitButton: "Zur Zahlung",
      alreadyHaveAccount: "Bereits ein Konto?",
      signIn: "Anmelden",
      errorDefault: "Fehler bei der Registrierung",
      plan: "Plan",
    },
    dashboard: {
      greeting: "Guten Tag",
      overview: "Übersicht von",
      yourSite: "Ihre Website",
      siteNotGenerated: "Website noch nicht erstellt",
      statusLive: "Live",
      statusPreparation: "In Vorbereitung",
      editSite: "Website bearbeiten",
      visitsPerMonth: "Besuche / Monat",
      lighthouse: "Lighthouse",
      conversations: "Konversationen",
      resolutionRate: "Lösungsrate",
      monthlyReports: "Monatliche Berichte",
      seeAll: "Alle anzeigen",
      noReportsYet: "Noch keine Berichte. Der erste kommt am Monatsende.",
      inPreparation: "In Vorbereitung",
      account: "Konto",
      status: "Status",
      statusActive: "Aktiv",
      sector: "Branche",
      clientSince: "Kunde seit",
      manageAccount: "Konto verwalten",
      errorDashboard: "Dashboard-Fehler",
    },
    editor: {
      projectName: "Editor",
      tabCode: "Code",
      tabPreview: "Vorschau",
      shareButton: "Teilen",
      copiedButton: "Kopiert",
      publishButton: "Veröffentlichen",
      chatTitle: "Chat",
      emptyStateHeadline: "Was möchten Sie erstellen?",
      emptyStateSubtitle: "Beschreiben Sie die Website, die Sie wünschen. Ich kann Landing Pages, Online-Shops, Portfolios, Blogs und vieles mehr erstellen.",
      suggestionRestaurant: "Erstellen Sie eine Website für mein Restaurant",
      suggestionEcommerce: "Erstellen Sie einen modernen Online-Shop",
      suggestionLanding: "Erstellen Sie eine SaaS-Landing-Page",
      suggestionPortfolio: "Erstellen Sie ein minimalistisches Foto-Portfolio",
      inputPlaceholder: "Beschreiben Sie, was Sie erstellen möchten...",
      explorerLabel: "Explorer",
      noFiles: "Keine Dateien. Bitten Sie die KI, etwas zu erstellen!",
      selectFileHint: "Wählen Sie eine Datei, um den Code anzuzeigen",
      toolWrite: "schreiben",
      toolEdit: "bearbeiten",
      toolRead: "lesen",
      toolPhotos: "fotos",
      previewDomain: "preview.madecreative.pro",
      errorConnection: "Verbindungsfehler. Bitte erneut versuchen.",
      errorGeneric: "Fehler. Bitte erneut versuchen.",
      loadingPreview: "Vorschau wird geladen...",
    },
    billing: {
      pageTitle: "Konto & Credits",
      pageSubtitle: "Plan, KI-Credits und Rechnungen verwalten",
      aiCredits: "KI-Credits",
      creditsRemaining: "verbleibend",
      creditPercent: "% verbleibend",
      extraCreditsLabel: "Enthält {n} zusätzlich gekaufte Credits",
      buyExtraCredits: "Zusätzliche Credits kaufen",
      costChat: "Chat",
      costSimpleEdit: "Einfache Bearbeitung",
      costComplexEdit: "Komplexe Bearbeitung",
      costOpus: "Opus (Premium)",
      credits: "Credits",
      currentPlan: "Aktueller Plan",
      perMonth: "/Monat",
      subscriptionActive: "Abonnement aktiv",
      nextCharge: "Nächste Abbuchung",
      invoiceHistory: "Rechnungshistorie",
      noInvoices: "Noch keine Rechnungen",
      invoiceDate: "Datum",
      invoiceDescription: "Beschreibung",
      invoiceAmount: "Betrag",
      invoiceStatus: "Status",
      statusPaid: "Bezahlt",
      statusPending: "Ausstehend",
      statusFailed: "Fehlgeschlagen",
      paymentMethod: "Zahlungsmethode",
      noPaymentMethod: "Keine Zahlungsmethode",
      manageOnStripe: "Auf Stripe verwalten",
      accountInfo: "Kontoinformationen",
      clientSince: "Kunde seit",
      plan: "Plan",
      pageOf: "Seite {current} von {total}",
      expires: "Läuft ab",
      addedCreditsSuccess: "{n} Credits erfolgreich hinzugefügt!",
      errorBuyCredits: "Fehler beim Kauf der Credits",
      errorBilling: "Abrechnungsfehler",
    },
    settings: {
      pageTitle: "Einstellungen",
      pageSubtitle: "Benutzerdefinierte Domain, Integrationen und Konnektoren",
      customDomain: "Benutzerdefinierte Domain",
      customDomainDesc: "Verbinden Sie Ihre Domain mit der Website (z.B. www.ihredomain.de)",
      domainPlaceholder: "www.ihredomain.de",
      connectButton: "Verbinden",
      configureDns: "DNS-Einträge konfigurieren",
      configureDnsDesc: "Fügen Sie diese Einträge im DNS-Panel Ihres Domain-Anbieters hinzu",
      domainVerified: "Domain verifiziert und aktiv",
      domainPending: "Nach der DNS-Konfiguration erfolgt die Verifizierung automatisch innerhalb von 24h.",
      noCustomDomain: "Ihre Website ist derzeit unter {domain}. Verbinden Sie eine benutzerdefinierte Domain für ein professionelleres Erscheinungsbild.",
      integrationsTitle: "Integrationen & Konnektoren",
      integrationsDesc: "Externe Dienste mit Ihrer Website verbinden",
      connectorConnected: "Verbunden",
      connectorNotConnected: "Nicht verbunden",
      getKeyLink: "Wie bekomme ich den API-Schlüssel?",
      saveSetting: "Speichern",
      connDescAnalytics: "Besuche und Nutzerverhalten verfolgen",
      connDescMaps: "Ihren Standort mit einer interaktiven Karte anzeigen",
      connDescMeta: "Konversionen von Facebook und Instagram verfolgen",
      connDescEmail: "Ihre E-Mail-Domain für Benachrichtigungen verwenden",
      connDescChat: "Livechat als Alternative zum KI-Chatbot",
      connDescSsl: "Benutzerdefiniertes SSL-Zertifikat für Ihre Domain",
      connEmailPlaceholder: "info@ihredomain.de",
      connEmailLabel: "Benutzerdefinierte E-Mail",
      errorDomain: "Fehler bei der Domain-Konfiguration",
    },
    reports: {
      pageTitle: "Berichte",
      pageSubtitle: "Monatliche Leistungsübersicht",
      noReports: "Noch keine Berichte verfügbar",
      generateNow: "Jetzt erstellen",
      websiteVisits: "Website-Besuche",
      leads: "Leads",
      conversions: "Konversionen",
      chatbot: "Chatbot",
      timeSaved: "Gesparte Zeit",
      insights: "Erkenntnisse",
      recommendations: "Empfehlungen",
      goals: "Ziele für den nächsten Monat",
      downloadPdf: "PDF herunterladen",
      viewReport: "Bericht anzeigen",
      generating: "Wird erstellt...",
      sentOn: "Gesendet am",
      inPreparation: "In Vorbereitung",
    },
    onboarding: {
      welcome: "Willkommen",
      step: "Schritt",
      of: "von",
      next: "Weiter",
      finish: "Fertigstellen",
      skip: "Überspringen",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ENGLISH — clean modern tech copy
  // ────────────────────────────────────────────────────────────────────────────
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      retry: "Try again",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      back: "Back",
      next: "Next",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      copy: "Copy",
      copied: "Copied",
      search: "Search",
      noData: "No data available",
      yes: "Yes",
      no: "No",
      optional: "optional",
      learnMore: "Learn more",
      dataUnavailable: "Data unavailable",
    },
    layout: {
      loadingApp: "Loading...",
    },
    nav: {
      dashboard: "Dashboard",
      editor: "Editor",
      chatbot: "Chatbot",
      reports: "Reports",
      settings: "Settings",
      billing: "Billing",
      website: "Website",
      templates: "Templates",
      logout: "Log out",
    },
    header: {
      account: "Account",
      profile: "Profile",
    },
    login: {
      pageTitle: "Sign in",
      tagline: "Your digital partner",
      heroHeadline: "Your digital presence,\nfully in control.",
      heroSubtitle: "Track visits, leads, chatbot and billing — all in one clean dashboard.",
      heroStatClients: "Active clients",
      heroStatLeads: "Leads generated",
      heroStatUptime: "Uptime",
      heroStatSatisfaction: "Satisfaction",
      clientPortal: "Client Portal",
      emailLabel: "Email address",
      emailPlaceholder: "you@company.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Forgot your password?",
      submitButton: "Sign in",
      supportText: "Having trouble signing in?",
      supportLink: "Contact support",
      showPassword: "Show password",
      hidePassword: "Hide password",
      invalidCredentials: "Invalid credentials",
      welcomeBack: "Welcome back",
    },
    signup: {
      pageTitle: "Sign up",
      heroHeadlineA: "Build your website",
      heroHeadlineB: "in",
      heroHeadlineHighlight: "60 seconds",
      heroSubtitle: "Complete registration to activate your plan.",
      heroStatSites: "Sites created",
      heroStatTime: "Average time",
      heroStatUptime: "Uptime",
      heroStatSatisfaction: "Satisfaction",
      formTitle: "Sign up — Plan",
      formSubtitle: "Complete registration to proceed to payment",
      emailLabel: "Email address",
      emailPlaceholder: "you@company.com",
      companyLabel: "Company name",
      companyPlaceholder: "Your company",
      websiteLabel: "Website URL",
      websitePlaceholder: "https://www.example.com",
      submitButton: "Proceed to payment",
      alreadyHaveAccount: "Already have an account?",
      signIn: "Sign in",
      errorDefault: "Registration error",
      plan: "Plan",
    },
    dashboard: {
      greeting: "Hello",
      overview: "Overview of",
      yourSite: "Your site",
      siteNotGenerated: "Site not yet generated",
      statusLive: "Live",
      statusPreparation: "In preparation",
      editSite: "Edit your site",
      visitsPerMonth: "Visits / month",
      lighthouse: "Lighthouse",
      conversations: "Conversations",
      resolutionRate: "Resolution rate",
      monthlyReports: "Monthly reports",
      seeAll: "See all",
      noReportsYet: "No reports yet. The first one arrives at the end of the month.",
      inPreparation: "In preparation",
      account: "Account",
      status: "Status",
      statusActive: "Active",
      sector: "Sector",
      clientSince: "Client since",
      manageAccount: "Manage account",
      errorDashboard: "Dashboard error",
    },
    editor: {
      projectName: "Editor",
      tabCode: "Code",
      tabPreview: "Preview",
      shareButton: "Share",
      copiedButton: "Copied",
      publishButton: "Publish",
      chatTitle: "Chat",
      emptyStateHeadline: "What do you want to build?",
      emptyStateSubtitle: "Describe the site you want. I can create landing pages, e-commerce stores, portfolios, blogs — anything.",
      suggestionRestaurant: "Create a website for my restaurant",
      suggestionEcommerce: "Build me a modern e-commerce store",
      suggestionLanding: "Create a SaaS landing page",
      suggestionPortfolio: "Create a minimalist photo portfolio",
      inputPlaceholder: "Describe what you want to build...",
      explorerLabel: "Explorer",
      noFiles: "No files. Ask the AI to build something!",
      selectFileHint: "Select a file to view the code",
      toolWrite: "write",
      toolEdit: "edit",
      toolRead: "read",
      toolPhotos: "photos",
      previewDomain: "preview.madecreative.pro",
      errorConnection: "Connection error. Please try again.",
      errorGeneric: "Error. Please try again.",
      loadingPreview: "Loading preview...",
    },
    billing: {
      pageTitle: "Account & Credits",
      pageSubtitle: "Manage your plan, AI credits and invoices",
      aiCredits: "AI Credits",
      creditsRemaining: "remaining",
      creditPercent: "% remaining",
      extraCreditsLabel: "Includes {n} extra purchased credits",
      buyExtraCredits: "Buy extra credits",
      costChat: "Chat",
      costSimpleEdit: "Simple edit",
      costComplexEdit: "Complex edit",
      costOpus: "Opus (premium)",
      credits: "credits",
      currentPlan: "Current plan",
      perMonth: "/month",
      subscriptionActive: "Subscription active",
      nextCharge: "Next charge",
      invoiceHistory: "Invoice history",
      noInvoices: "No invoices yet",
      invoiceDate: "Date",
      invoiceDescription: "Description",
      invoiceAmount: "Amount",
      invoiceStatus: "Status",
      statusPaid: "Paid",
      statusPending: "Pending",
      statusFailed: "Failed",
      paymentMethod: "Payment method",
      noPaymentMethod: "No payment method",
      manageOnStripe: "Manage on Stripe",
      accountInfo: "Account info",
      clientSince: "Client since",
      plan: "Plan",
      pageOf: "Page {current} of {total}",
      expires: "Expires",
      addedCreditsSuccess: "{n} credits added successfully!",
      errorBuyCredits: "Error purchasing credits",
      errorBilling: "Billing error",
    },
    settings: {
      pageTitle: "Settings",
      pageSubtitle: "Custom domain, integrations and connectors",
      customDomain: "Custom domain",
      customDomainDesc: "Connect your domain to the site (e.g. www.yourdomain.com)",
      domainPlaceholder: "www.yourdomain.com",
      connectButton: "Connect",
      configureDns: "Configure DNS records",
      configureDnsDesc: "Add these records in your domain provider's DNS panel",
      domainVerified: "Domain verified and active",
      domainPending: "After configuring DNS, verification happens automatically within 24h.",
      noCustomDomain: "Your site is currently at {domain}. Connect a custom domain for a more professional look.",
      integrationsTitle: "Integrations & Connectors",
      integrationsDesc: "Connect external services to your site",
      connectorConnected: "Connected",
      connectorNotConnected: "Not connected",
      getKeyLink: "How to get the API key",
      saveSetting: "Save",
      connDescAnalytics: "Track visits and user behaviour",
      connDescMaps: "Show your location with an interactive map",
      connDescMeta: "Track conversions from Facebook and Instagram",
      connDescEmail: "Use your email domain for notifications",
      connDescChat: "Live chat alternative to the AI chatbot",
      connDescSsl: "Custom SSL certificate for your domain",
      connEmailPlaceholder: "info@yourdomain.com",
      connEmailLabel: "Custom email",
      errorDomain: "Domain configuration error",
    },
    reports: {
      pageTitle: "Reports",
      pageSubtitle: "Monthly performance overview",
      noReports: "No reports available yet",
      generateNow: "Generate now",
      websiteVisits: "Website visits",
      leads: "Leads",
      conversions: "Conversions",
      chatbot: "Chatbot",
      timeSaved: "Time saved",
      insights: "Insights",
      recommendations: "Recommendations",
      goals: "Goals for next month",
      downloadPdf: "Download PDF",
      viewReport: "View report",
      generating: "Generating...",
      sentOn: "Sent on",
      inPreparation: "In preparation",
    },
    onboarding: {
      welcome: "Welcome",
      step: "Step",
      of: "of",
      next: "Next",
      finish: "Finish",
      skip: "Skip",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ITALIAN — warm professional
  // ────────────────────────────────────────────────────────────────────────────
  it: {
    common: {
      loading: "Caricamento...",
      error: "Errore",
      retry: "Riprova",
      save: "Salva",
      cancel: "Annulla",
      close: "Chiudi",
      back: "Indietro",
      next: "Avanti",
      confirm: "Conferma",
      delete: "Elimina",
      edit: "Modifica",
      copy: "Copia",
      copied: "Copiato",
      search: "Cerca",
      noData: "Nessun dato disponibile",
      yes: "Sì",
      no: "No",
      optional: "opzionale",
      learnMore: "Scopri di più",
      dataUnavailable: "Dati non disponibili",
    },
    layout: {
      loadingApp: "Caricamento...",
    },
    nav: {
      dashboard: "Dashboard",
      editor: "Editor",
      chatbot: "Chatbot",
      reports: "Report",
      settings: "Impostazioni",
      billing: "Fatturazione",
      website: "Sito web",
      templates: "Template",
      logout: "Esci",
    },
    header: {
      account: "Account",
      profile: "Profilo",
    },
    login: {
      pageTitle: "Accedi",
      tagline: "Il tuo partner digitale",
      heroHeadline: "La tua presenza\ndigitale, sotto\ncontrollo.",
      heroSubtitle: "Monitora visite, lead, chatbot e fatturazione — tutto in un unico pannello.",
      heroStatClients: "Clienti attivi",
      heroStatLeads: "Lead generati",
      heroStatUptime: "Uptime",
      heroStatSatisfaction: "Soddisfazione",
      clientPortal: "Portale Cliente",
      emailLabel: "Indirizzo email",
      emailPlaceholder: "tu@azienda.it",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Hai dimenticato la password?",
      submitButton: "Accedi",
      supportText: "Problemi di accesso?",
      supportLink: "Contatta il supporto",
      showPassword: "Mostra password",
      hidePassword: "Nascondi password",
      invalidCredentials: "Credenziali non valide",
      welcomeBack: "Bentornato",
    },
    signup: {
      pageTitle: "Registrati",
      heroHeadlineA: "Crea il tuo sito",
      heroHeadlineB: "in",
      heroHeadlineHighlight: "60 secondi",
      heroSubtitle: "Completa la registrazione per attivare il tuo piano.",
      heroStatSites: "Siti creati",
      heroStatTime: "Tempo medio",
      heroStatUptime: "Uptime",
      heroStatSatisfaction: "Soddisfazione",
      formTitle: "Registrati — Piano",
      formSubtitle: "Completa la registrazione per procedere al pagamento",
      emailLabel: "Indirizzo email",
      emailPlaceholder: "tu@azienda.it",
      companyLabel: "Nome azienda",
      companyPlaceholder: "La tua azienda",
      websiteLabel: "URL sito web",
      websitePlaceholder: "https://www.esempio.it",
      submitButton: "Procedi al pagamento",
      alreadyHaveAccount: "Hai già un account?",
      signIn: "Accedi",
      errorDefault: "Errore durante la registrazione",
      plan: "Piano",
    },
    dashboard: {
      greeting: "Ciao",
      overview: "Panoramica di",
      yourSite: "Il tuo sito",
      siteNotGenerated: "Sito non ancora generato",
      statusLive: "Live",
      statusPreparation: "In preparazione",
      editSite: "Modifica il tuo sito",
      visitsPerMonth: "Visite / mese",
      lighthouse: "Lighthouse",
      conversations: "Conversazioni",
      resolutionRate: "Tasso risoluzione",
      monthlyReports: "Report mensili",
      seeAll: "Vedi tutti",
      noReportsYet: "Nessun report ancora. Il primo arriverà a fine mese.",
      inPreparation: "In preparazione",
      account: "Account",
      status: "Stato",
      statusActive: "Attivo",
      sector: "Settore",
      clientSince: "Cliente dal",
      manageAccount: "Gestisci account",
      errorDashboard: "Errore dashboard",
    },
    editor: {
      projectName: "Editor",
      tabCode: "Codice",
      tabPreview: "Anteprima",
      shareButton: "Condividi",
      copiedButton: "Copiato",
      publishButton: "Pubblica",
      chatTitle: "Chat",
      emptyStateHeadline: "Cosa vuoi costruire?",
      emptyStateSubtitle: "Descrivi il sito che vuoi. Posso creare landing page, e-commerce, portfolio, blog, qualsiasi cosa.",
      suggestionRestaurant: "Crea un sito per il mio ristorante italiano",
      suggestionEcommerce: "Crea un moderno e-commerce",
      suggestionLanding: "Fammi una landing page SaaS",
      suggestionPortfolio: "Crea un portfolio fotografico minimalista",
      inputPlaceholder: "Descrivi cosa vuoi costruire...",
      explorerLabel: "Esplora",
      noFiles: "Nessun file. Chiedi all'AI di costruire qualcosa!",
      selectFileHint: "Seleziona un file per visualizzare il codice",
      toolWrite: "scrivi",
      toolEdit: "modifica",
      toolRead: "leggi",
      toolPhotos: "foto",
      previewDomain: "preview.madecreative.pro",
      errorConnection: "Errore di connessione. Riprova.",
      errorGeneric: "Errore. Riprova.",
      loadingPreview: "Caricamento anteprima...",
    },
    billing: {
      pageTitle: "Account & Crediti",
      pageSubtitle: "Gestisci piano, crediti AI e fatture",
      aiCredits: "Crediti AI",
      creditsRemaining: "rimanenti",
      creditPercent: "% rimanente",
      extraCreditsLabel: "Include {n} crediti extra acquistati",
      buyExtraCredits: "Acquista crediti extra",
      costChat: "Chat",
      costSimpleEdit: "Edit semplice",
      costComplexEdit: "Edit complesso",
      costOpus: "Opus (premium)",
      credits: "crediti",
      currentPlan: "Piano attuale",
      perMonth: "/mese",
      subscriptionActive: "Abbonamento attivo",
      nextCharge: "Prossimo addebito",
      invoiceHistory: "Storico fatture",
      noInvoices: "Nessuna fattura ancora",
      invoiceDate: "Data",
      invoiceDescription: "Descrizione",
      invoiceAmount: "Importo",
      invoiceStatus: "Stato",
      statusPaid: "Pagata",
      statusPending: "In attesa",
      statusFailed: "Fallita",
      paymentMethod: "Metodo di pagamento",
      noPaymentMethod: "Nessun metodo",
      manageOnStripe: "Gestisci su Stripe",
      accountInfo: "Info account",
      clientSince: "Cliente dal",
      plan: "Piano",
      pageOf: "Pagina {current} di {total}",
      expires: "Scade",
      addedCreditsSuccess: "{n} crediti aggiunti con successo!",
      errorBuyCredits: "Errore nell'acquisto dei crediti",
      errorBilling: "Errore fatturazione",
    },
    settings: {
      pageTitle: "Impostazioni",
      pageSubtitle: "Dominio personalizzato, integrazioni e connettori",
      customDomain: "Dominio personalizzato",
      customDomainDesc: "Connetti il tuo dominio al sito (es. www.tuodominio.it)",
      domainPlaceholder: "www.tuodominio.it",
      connectButton: "Connetti",
      configureDns: "Configura i record DNS",
      configureDnsDesc: "Aggiungi questi record nel pannello DNS del tuo provider di dominio",
      domainVerified: "Dominio verificato e attivo",
      domainPending: "Dopo aver configurato i DNS, la verifica avviene automaticamente entro 24h.",
      noCustomDomain: "Il tuo sito è attualmente su {domain}. Connetti un dominio personalizzato per un aspetto più professionale.",
      integrationsTitle: "Integrazioni e Connettori",
      integrationsDesc: "Collega servizi esterni al tuo sito",
      connectorConnected: "Connesso",
      connectorNotConnected: "Non connesso",
      getKeyLink: "Come ottenere la chiave",
      saveSetting: "Salva",
      connDescAnalytics: "Traccia le visite e il comportamento degli utenti",
      connDescMaps: "Mostra la tua posizione con una mappa interattiva",
      connDescMeta: "Traccia le conversioni da Facebook e Instagram",
      connDescEmail: "Usa il tuo dominio email per le notifiche",
      connDescChat: "Livechat alternativa al chatbot AI",
      connDescSsl: "Certificato SSL personalizzato per il tuo dominio",
      connEmailPlaceholder: "info@tuodominio.it",
      connEmailLabel: "Email personalizzata",
      errorDomain: "Errore nella configurazione del dominio",
    },
    reports: {
      pageTitle: "Report",
      pageSubtitle: "Panoramica mensile delle performance",
      noReports: "Nessun report disponibile ancora",
      generateNow: "Genera ora",
      websiteVisits: "Visite al sito",
      leads: "Lead",
      conversions: "Conversioni",
      chatbot: "Chatbot",
      timeSaved: "Tempo risparmiato",
      insights: "Insight",
      recommendations: "Raccomandazioni",
      goals: "Obiettivi del prossimo mese",
      downloadPdf: "Scarica PDF",
      viewReport: "Visualizza report",
      generating: "Generazione in corso...",
      sentOn: "Inviato il",
      inPreparation: "In preparazione",
    },
    onboarding: {
      welcome: "Benvenuto",
      step: "Passo",
      of: "di",
      next: "Avanti",
      finish: "Termina",
      skip: "Salta",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // SPANISH — informal "tú"
  // ────────────────────────────────────────────────────────────────────────────
  es: {
    common: {
      loading: "Cargando...",
      error: "Error",
      retry: "Reintentar",
      save: "Guardar",
      cancel: "Cancelar",
      close: "Cerrar",
      back: "Atrás",
      next: "Siguiente",
      confirm: "Confirmar",
      delete: "Eliminar",
      edit: "Editar",
      copy: "Copiar",
      copied: "Copiado",
      search: "Buscar",
      noData: "No hay datos disponibles",
      yes: "Sí",
      no: "No",
      optional: "opcional",
      learnMore: "Saber más",
      dataUnavailable: "Datos no disponibles",
    },
    layout: {
      loadingApp: "Cargando...",
    },
    nav: {
      dashboard: "Dashboard",
      editor: "Editor",
      chatbot: "Chatbot",
      reports: "Informes",
      settings: "Ajustes",
      billing: "Facturación",
      website: "Sitio web",
      templates: "Plantillas",
      logout: "Cerrar sesión",
    },
    header: {
      account: "Cuenta",
      profile: "Perfil",
    },
    login: {
      pageTitle: "Iniciar sesión",
      tagline: "Tu socio digital",
      heroHeadline: "Tu presencia digital,\nbajo control.",
      heroSubtitle: "Monitorea visitas, leads, chatbot y facturación — todo en un solo panel.",
      heroStatClients: "Clientes activos",
      heroStatLeads: "Leads generados",
      heroStatUptime: "Disponibilidad",
      heroStatSatisfaction: "Satisfacción",
      clientPortal: "Portal de cliente",
      emailLabel: "Dirección de email",
      emailPlaceholder: "tu@empresa.com",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "••••••••",
      forgotPassword: "¿Olvidaste tu contraseña?",
      submitButton: "Entrar",
      supportText: "¿Problemas para acceder?",
      supportLink: "Contactar soporte",
      showPassword: "Mostrar contraseña",
      hidePassword: "Ocultar contraseña",
      invalidCredentials: "Credenciales inválidas",
      welcomeBack: "Bienvenido de nuevo",
    },
    signup: {
      pageTitle: "Registrarse",
      heroHeadlineA: "Crea tu sitio web",
      heroHeadlineB: "en",
      heroHeadlineHighlight: "60 segundos",
      heroSubtitle: "Completa el registro para activar tu plan.",
      heroStatSites: "Sitios creados",
      heroStatTime: "Tiempo promedio",
      heroStatUptime: "Disponibilidad",
      heroStatSatisfaction: "Satisfacción",
      formTitle: "Regístrate — Plan",
      formSubtitle: "Completa el registro para proceder al pago",
      emailLabel: "Dirección de email",
      emailPlaceholder: "tu@empresa.com",
      companyLabel: "Nombre de la empresa",
      companyPlaceholder: "Tu empresa",
      websiteLabel: "URL del sitio web",
      websitePlaceholder: "https://www.ejemplo.com",
      submitButton: "Proceder al pago",
      alreadyHaveAccount: "¿Ya tienes cuenta?",
      signIn: "Entrar",
      errorDefault: "Error durante el registro",
      plan: "Plan",
    },
    dashboard: {
      greeting: "Hola",
      overview: "Resumen de",
      yourSite: "Tu sitio",
      siteNotGenerated: "Sitio aún no generado",
      statusLive: "En vivo",
      statusPreparation: "En preparación",
      editSite: "Editar tu sitio",
      visitsPerMonth: "Visitas / mes",
      lighthouse: "Lighthouse",
      conversations: "Conversaciones",
      resolutionRate: "Tasa de resolución",
      monthlyReports: "Informes mensuales",
      seeAll: "Ver todos",
      noReportsYet: "Sin informes aún. El primero llegará a fin de mes.",
      inPreparation: "En preparación",
      account: "Cuenta",
      status: "Estado",
      statusActive: "Activo",
      sector: "Sector",
      clientSince: "Cliente desde",
      manageAccount: "Gestionar cuenta",
      errorDashboard: "Error del dashboard",
    },
    editor: {
      projectName: "Editor",
      tabCode: "Código",
      tabPreview: "Vista previa",
      shareButton: "Compartir",
      copiedButton: "Copiado",
      publishButton: "Publicar",
      chatTitle: "Chat",
      emptyStateHeadline: "¿Qué quieres crear?",
      emptyStateSubtitle: "Describe el sitio que quieres. Puedo crear landing pages, tiendas, portfolios, blogs — lo que sea.",
      suggestionRestaurant: "Crea un sitio para mi restaurante",
      suggestionEcommerce: "Hazme una tienda online moderna",
      suggestionLanding: "Crea una landing page SaaS",
      suggestionPortfolio: "Crea un portfolio fotográfico minimalista",
      inputPlaceholder: "Describe qué quieres crear...",
      explorerLabel: "Explorador",
      noFiles: "Sin archivos. ¡Pide a la IA que cree algo!",
      selectFileHint: "Selecciona un archivo para ver el código",
      toolWrite: "escribir",
      toolEdit: "editar",
      toolRead: "leer",
      toolPhotos: "fotos",
      previewDomain: "preview.madecreative.pro",
      errorConnection: "Error de conexión. Inténtalo de nuevo.",
      errorGeneric: "Error. Inténtalo de nuevo.",
      loadingPreview: "Cargando vista previa...",
    },
    billing: {
      pageTitle: "Cuenta y Créditos",
      pageSubtitle: "Gestiona plan, créditos IA y facturas",
      aiCredits: "Créditos IA",
      creditsRemaining: "restantes",
      creditPercent: "% restante",
      extraCreditsLabel: "Incluye {n} créditos extra comprados",
      buyExtraCredits: "Comprar créditos extra",
      costChat: "Chat",
      costSimpleEdit: "Edición simple",
      costComplexEdit: "Edición compleja",
      costOpus: "Opus (premium)",
      credits: "créditos",
      currentPlan: "Plan actual",
      perMonth: "/mes",
      subscriptionActive: "Suscripción activa",
      nextCharge: "Próximo cobro",
      invoiceHistory: "Historial de facturas",
      noInvoices: "Sin facturas aún",
      invoiceDate: "Fecha",
      invoiceDescription: "Descripción",
      invoiceAmount: "Importe",
      invoiceStatus: "Estado",
      statusPaid: "Pagada",
      statusPending: "Pendiente",
      statusFailed: "Fallida",
      paymentMethod: "Método de pago",
      noPaymentMethod: "Sin método de pago",
      manageOnStripe: "Gestionar en Stripe",
      accountInfo: "Info de cuenta",
      clientSince: "Cliente desde",
      plan: "Plan",
      pageOf: "Página {current} de {total}",
      expires: "Expira",
      addedCreditsSuccess: "¡{n} créditos añadidos con éxito!",
      errorBuyCredits: "Error al comprar créditos",
      errorBilling: "Error de facturación",
    },
    settings: {
      pageTitle: "Ajustes",
      pageSubtitle: "Dominio personalizado, integraciones y conectores",
      customDomain: "Dominio personalizado",
      customDomainDesc: "Conecta tu dominio al sitio (ej. www.tudominio.com)",
      domainPlaceholder: "www.tudominio.com",
      connectButton: "Conectar",
      configureDns: "Configurar registros DNS",
      configureDnsDesc: "Añade estos registros en el panel DNS de tu proveedor de dominio",
      domainVerified: "Dominio verificado y activo",
      domainPending: "Tras configurar el DNS, la verificación ocurre automáticamente en 24h.",
      noCustomDomain: "Tu sitio está en {domain}. Conecta un dominio personalizado para un aspecto más profesional.",
      integrationsTitle: "Integraciones y Conectores",
      integrationsDesc: "Conecta servicios externos a tu sitio",
      connectorConnected: "Conectado",
      connectorNotConnected: "No conectado",
      getKeyLink: "Cómo obtener la clave API",
      saveSetting: "Guardar",
      connDescAnalytics: "Rastrea visitas y comportamiento de usuarios",
      connDescMaps: "Muestra tu ubicación con un mapa interactivo",
      connDescMeta: "Rastrea conversiones de Facebook e Instagram",
      connDescEmail: "Usa tu dominio de email para notificaciones",
      connDescChat: "Chat en vivo como alternativa al chatbot IA",
      connDescSsl: "Certificado SSL personalizado para tu dominio",
      connEmailPlaceholder: "info@tudominio.com",
      connEmailLabel: "Email personalizado",
      errorDomain: "Error en la configuración del dominio",
    },
    reports: {
      pageTitle: "Informes",
      pageSubtitle: "Resumen mensual de rendimiento",
      noReports: "Aún no hay informes disponibles",
      generateNow: "Generar ahora",
      websiteVisits: "Visitas al sitio",
      leads: "Leads",
      conversions: "Conversiones",
      chatbot: "Chatbot",
      timeSaved: "Tiempo ahorrado",
      insights: "Insights",
      recommendations: "Recomendaciones",
      goals: "Objetivos para el próximo mes",
      downloadPdf: "Descargar PDF",
      viewReport: "Ver informe",
      generating: "Generando...",
      sentOn: "Enviado el",
      inPreparation: "En preparación",
    },
    onboarding: {
      welcome: "Bienvenido",
      step: "Paso",
      of: "de",
      next: "Siguiente",
      finish: "Finalizar",
      skip: "Omitir",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FRENCH — formal "vous"
  // ────────────────────────────────────────────────────────────────────────────
  fr: {
    common: {
      loading: "Chargement...",
      error: "Erreur",
      retry: "Réessayer",
      save: "Enregistrer",
      cancel: "Annuler",
      close: "Fermer",
      back: "Retour",
      next: "Suivant",
      confirm: "Confirmer",
      delete: "Supprimer",
      edit: "Modifier",
      copy: "Copier",
      copied: "Copié",
      search: "Rechercher",
      noData: "Aucune donnée disponible",
      yes: "Oui",
      no: "Non",
      optional: "optionnel",
      learnMore: "En savoir plus",
      dataUnavailable: "Données non disponibles",
    },
    layout: {
      loadingApp: "Chargement...",
    },
    nav: {
      dashboard: "Tableau de bord",
      editor: "Éditeur",
      chatbot: "Chatbot",
      reports: "Rapports",
      settings: "Paramètres",
      billing: "Facturation",
      website: "Site web",
      templates: "Modèles",
      logout: "Déconnexion",
    },
    header: {
      account: "Compte",
      profile: "Profil",
    },
    login: {
      pageTitle: "Se connecter",
      tagline: "Votre partenaire digital",
      heroHeadline: "Votre présence digitale,\npleinement maîtrisée.",
      heroSubtitle: "Suivez visites, leads, chatbot et facturation — tout en un seul tableau de bord.",
      heroStatClients: "Clients actifs",
      heroStatLeads: "Leads générés",
      heroStatUptime: "Disponibilité",
      heroStatSatisfaction: "Satisfaction",
      clientPortal: "Portail client",
      emailLabel: "Adresse email",
      emailPlaceholder: "vous@entreprise.fr",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Mot de passe oublié ?",
      submitButton: "Se connecter",
      supportText: "Problèmes de connexion ?",
      supportLink: "Contacter le support",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      invalidCredentials: "Identifiants invalides",
      welcomeBack: "Bon retour",
    },
    signup: {
      pageTitle: "S'inscrire",
      heroHeadlineA: "Créez votre site web",
      heroHeadlineB: "en",
      heroHeadlineHighlight: "60 secondes",
      heroSubtitle: "Complétez l'inscription pour activer votre plan.",
      heroStatSites: "Sites créés",
      heroStatTime: "Temps moyen",
      heroStatUptime: "Disponibilité",
      heroStatSatisfaction: "Satisfaction",
      formTitle: "S'inscrire — Plan",
      formSubtitle: "Complétez l'inscription pour procéder au paiement",
      emailLabel: "Adresse email",
      emailPlaceholder: "vous@entreprise.fr",
      companyLabel: "Nom de l'entreprise",
      companyPlaceholder: "Votre entreprise",
      websiteLabel: "URL du site web",
      websitePlaceholder: "https://www.exemple.fr",
      submitButton: "Procéder au paiement",
      alreadyHaveAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
      errorDefault: "Erreur lors de l'inscription",
      plan: "Plan",
    },
    dashboard: {
      greeting: "Bonjour",
      overview: "Vue d'ensemble de",
      yourSite: "Votre site",
      siteNotGenerated: "Site pas encore généré",
      statusLive: "En ligne",
      statusPreparation: "En préparation",
      editSite: "Modifier votre site",
      visitsPerMonth: "Visites / mois",
      lighthouse: "Lighthouse",
      conversations: "Conversations",
      resolutionRate: "Taux de résolution",
      monthlyReports: "Rapports mensuels",
      seeAll: "Voir tout",
      noReportsYet: "Aucun rapport pour l'instant. Le premier arrivera en fin de mois.",
      inPreparation: "En préparation",
      account: "Compte",
      status: "Statut",
      statusActive: "Actif",
      sector: "Secteur",
      clientSince: "Client depuis",
      manageAccount: "Gérer le compte",
      errorDashboard: "Erreur du tableau de bord",
    },
    editor: {
      projectName: "Éditeur",
      tabCode: "Code",
      tabPreview: "Aperçu",
      shareButton: "Partager",
      copiedButton: "Copié",
      publishButton: "Publier",
      chatTitle: "Chat",
      emptyStateHeadline: "Que souhaitez-vous créer ?",
      emptyStateSubtitle: "Décrivez le site que vous voulez. Je peux créer des landing pages, boutiques en ligne, portfolios, blogs — tout ce que vous voulez.",
      suggestionRestaurant: "Créez un site pour mon restaurant",
      suggestionEcommerce: "Créez une boutique en ligne moderne",
      suggestionLanding: "Créez une landing page SaaS",
      suggestionPortfolio: "Créez un portfolio photo minimaliste",
      inputPlaceholder: "Décrivez ce que vous souhaitez créer...",
      explorerLabel: "Explorateur",
      noFiles: "Aucun fichier. Demandez à l'IA de créer quelque chose !",
      selectFileHint: "Sélectionnez un fichier pour afficher le code",
      toolWrite: "écrire",
      toolEdit: "modifier",
      toolRead: "lire",
      toolPhotos: "photos",
      previewDomain: "preview.madecreative.pro",
      errorConnection: "Erreur de connexion. Veuillez réessayer.",
      errorGeneric: "Erreur. Veuillez réessayer.",
      loadingPreview: "Chargement de l'aperçu...",
    },
    billing: {
      pageTitle: "Compte & Crédits",
      pageSubtitle: "Gérez votre plan, crédits IA et factures",
      aiCredits: "Crédits IA",
      creditsRemaining: "restants",
      creditPercent: "% restant",
      extraCreditsLabel: "Inclut {n} crédits supplémentaires achetés",
      buyExtraCredits: "Acheter des crédits supplémentaires",
      costChat: "Chat",
      costSimpleEdit: "Modification simple",
      costComplexEdit: "Modification complexe",
      costOpus: "Opus (premium)",
      credits: "crédits",
      currentPlan: "Plan actuel",
      perMonth: "/mois",
      subscriptionActive: "Abonnement actif",
      nextCharge: "Prochain prélèvement",
      invoiceHistory: "Historique des factures",
      noInvoices: "Aucune facture pour l'instant",
      invoiceDate: "Date",
      invoiceDescription: "Description",
      invoiceAmount: "Montant",
      invoiceStatus: "Statut",
      statusPaid: "Payée",
      statusPending: "En attente",
      statusFailed: "Échouée",
      paymentMethod: "Moyen de paiement",
      noPaymentMethod: "Aucun moyen de paiement",
      manageOnStripe: "Gérer sur Stripe",
      accountInfo: "Infos du compte",
      clientSince: "Client depuis",
      plan: "Plan",
      pageOf: "Page {current} sur {total}",
      expires: "Expire",
      addedCreditsSuccess: "{n} crédits ajoutés avec succès !",
      errorBuyCredits: "Erreur lors de l'achat des crédits",
      errorBilling: "Erreur de facturation",
    },
    settings: {
      pageTitle: "Paramètres",
      pageSubtitle: "Domaine personnalisé, intégrations et connecteurs",
      customDomain: "Domaine personnalisé",
      customDomainDesc: "Connectez votre domaine au site (ex. www.votredomaine.fr)",
      domainPlaceholder: "www.votredomaine.fr",
      connectButton: "Connecter",
      configureDns: "Configurer les enregistrements DNS",
      configureDnsDesc: "Ajoutez ces enregistrements dans le panneau DNS de votre fournisseur de domaine",
      domainVerified: "Domaine vérifié et actif",
      domainPending: "Après la configuration DNS, la vérification s'effectue automatiquement sous 24h.",
      noCustomDomain: "Votre site est actuellement sur {domain}. Connectez un domaine personnalisé pour un look plus professionnel.",
      integrationsTitle: "Intégrations et Connecteurs",
      integrationsDesc: "Connectez des services externes à votre site",
      connectorConnected: "Connecté",
      connectorNotConnected: "Non connecté",
      getKeyLink: "Comment obtenir la clé API",
      saveSetting: "Enregistrer",
      connDescAnalytics: "Suivez les visites et le comportement des utilisateurs",
      connDescMaps: "Affichez votre position avec une carte interactive",
      connDescMeta: "Suivez les conversions depuis Facebook et Instagram",
      connDescEmail: "Utilisez votre domaine email pour les notifications",
      connDescChat: "Chat en direct comme alternative au chatbot IA",
      connDescSsl: "Certificat SSL personnalisé pour votre domaine",
      connEmailPlaceholder: "info@votredomaine.fr",
      connEmailLabel: "Email personnalisé",
      errorDomain: "Erreur de configuration du domaine",
    },
    reports: {
      pageTitle: "Rapports",
      pageSubtitle: "Synthèse mensuelle des performances",
      noReports: "Aucun rapport disponible pour l'instant",
      generateNow: "Générer maintenant",
      websiteVisits: "Visites du site",
      leads: "Leads",
      conversions: "Conversions",
      chatbot: "Chatbot",
      timeSaved: "Temps économisé",
      insights: "Analyses",
      recommendations: "Recommandations",
      goals: "Objectifs du mois prochain",
      downloadPdf: "Télécharger PDF",
      viewReport: "Voir le rapport",
      generating: "Génération en cours...",
      sentOn: "Envoyé le",
      inPreparation: "En préparation",
    },
    onboarding: {
      welcome: "Bienvenue",
      step: "Étape",
      of: "sur",
      next: "Suivant",
      finish: "Terminer",
      skip: "Passer",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DUTCH — informal "je"
  // ────────────────────────────────────────────────────────────────────────────
  nl: {
    common: {
      loading: "Laden...",
      error: "Fout",
      retry: "Opnieuw proberen",
      save: "Opslaan",
      cancel: "Annuleren",
      close: "Sluiten",
      back: "Terug",
      next: "Volgende",
      confirm: "Bevestigen",
      delete: "Verwijderen",
      edit: "Bewerken",
      copy: "Kopiëren",
      copied: "Gekopieerd",
      search: "Zoeken",
      noData: "Geen gegevens beschikbaar",
      yes: "Ja",
      no: "Nee",
      optional: "optioneel",
      learnMore: "Meer info",
      dataUnavailable: "Gegevens niet beschikbaar",
    },
    layout: {
      loadingApp: "Laden...",
    },
    nav: {
      dashboard: "Dashboard",
      editor: "Editor",
      chatbot: "Chatbot",
      reports: "Rapporten",
      settings: "Instellingen",
      billing: "Facturering",
      website: "Website",
      templates: "Sjablonen",
      logout: "Uitloggen",
    },
    header: {
      account: "Account",
      profile: "Profiel",
    },
    login: {
      pageTitle: "Inloggen",
      tagline: "Jouw digitale partner",
      heroHeadline: "Jouw digitale aanwezigheid,\nvolledig onder controle.",
      heroSubtitle: "Volg bezoeken, leads, chatbot en facturering — alles in één overzichtelijk dashboard.",
      heroStatClients: "Actieve klanten",
      heroStatLeads: "Gegenereerde leads",
      heroStatUptime: "Uptime",
      heroStatSatisfaction: "Tevredenheid",
      clientPortal: "Klantenportaal",
      emailLabel: "E-mailadres",
      emailPlaceholder: "jij@bedrijf.nl",
      passwordLabel: "Wachtwoord",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Wachtwoord vergeten?",
      submitButton: "Inloggen",
      supportText: "Problemen met inloggen?",
      supportLink: "Contact opnemen",
      showPassword: "Wachtwoord tonen",
      hidePassword: "Wachtwoord verbergen",
      invalidCredentials: "Ongeldige inloggegevens",
      welcomeBack: "Welkom terug",
    },
    signup: {
      pageTitle: "Registreren",
      heroHeadlineA: "Maak je website",
      heroHeadlineB: "in",
      heroHeadlineHighlight: "60 seconden",
      heroSubtitle: "Voltooi de registratie om je plan te activeren.",
      heroStatSites: "Gemaakte websites",
      heroStatTime: "Gemiddelde tijd",
      heroStatUptime: "Uptime",
      heroStatSatisfaction: "Tevredenheid",
      formTitle: "Registreren — Plan",
      formSubtitle: "Voltooi de registratie om door te gaan naar betaling",
      emailLabel: "E-mailadres",
      emailPlaceholder: "jij@bedrijf.nl",
      companyLabel: "Bedrijfsnaam",
      companyPlaceholder: "Jouw bedrijf",
      websiteLabel: "Website-URL",
      websitePlaceholder: "https://www.voorbeeld.nl",
      submitButton: "Doorgaan naar betaling",
      alreadyHaveAccount: "Al een account?",
      signIn: "Inloggen",
      errorDefault: "Fout bij registratie",
      plan: "Plan",
    },
    dashboard: {
      greeting: "Hoi",
      overview: "Overzicht van",
      yourSite: "Jouw site",
      siteNotGenerated: "Site nog niet aangemaakt",
      statusLive: "Live",
      statusPreparation: "In voorbereiding",
      editSite: "Jouw site bewerken",
      visitsPerMonth: "Bezoeken / maand",
      lighthouse: "Lighthouse",
      conversations: "Gesprekken",
      resolutionRate: "Oplossingspercentage",
      monthlyReports: "Maandelijkse rapporten",
      seeAll: "Alles bekijken",
      noReportsYet: "Nog geen rapporten. Het eerste komt aan het einde van de maand.",
      inPreparation: "In voorbereiding",
      account: "Account",
      status: "Status",
      statusActive: "Actief",
      sector: "Sector",
      clientSince: "Klant sinds",
      manageAccount: "Account beheren",
      errorDashboard: "Dashboard-fout",
    },
    editor: {
      projectName: "Editor",
      tabCode: "Code",
      tabPreview: "Voorbeeld",
      shareButton: "Delen",
      copiedButton: "Gekopieerd",
      publishButton: "Publiceren",
      chatTitle: "Chat",
      emptyStateHeadline: "Wat wil je maken?",
      emptyStateSubtitle: "Beschrijf de site die je wilt. Ik kan landing pages, webshops, portfolio's, blogs maken — van alles.",
      suggestionRestaurant: "Maak een website voor mijn restaurant",
      suggestionEcommerce: "Maak een moderne webshop",
      suggestionLanding: "Maak een SaaS-landingspagina",
      suggestionPortfolio: "Maak een minimalistisch fotoportfolio",
      inputPlaceholder: "Beschrijf wat je wilt maken...",
      explorerLabel: "Verkenner",
      noFiles: "Geen bestanden. Vraag de AI om iets te maken!",
      selectFileHint: "Selecteer een bestand om de code te bekijken",
      toolWrite: "schrijven",
      toolEdit: "bewerken",
      toolRead: "lezen",
      toolPhotos: "foto's",
      previewDomain: "preview.madecreative.pro",
      errorConnection: "Verbindingsfout. Probeer het opnieuw.",
      errorGeneric: "Fout. Probeer het opnieuw.",
      loadingPreview: "Voorbeeld laden...",
    },
    billing: {
      pageTitle: "Account & Credits",
      pageSubtitle: "Beheer je plan, AI-credits en facturen",
      aiCredits: "AI-credits",
      creditsRemaining: "resterend",
      creditPercent: "% resterend",
      extraCreditsLabel: "Bevat {n} extra gekochte credits",
      buyExtraCredits: "Extra credits kopen",
      costChat: "Chat",
      costSimpleEdit: "Eenvoudige bewerking",
      costComplexEdit: "Complexe bewerking",
      costOpus: "Opus (premium)",
      credits: "credits",
      currentPlan: "Huidig plan",
      perMonth: "/maand",
      subscriptionActive: "Abonnement actief",
      nextCharge: "Volgende afschrijving",
      invoiceHistory: "Factuurhistorie",
      noInvoices: "Nog geen facturen",
      invoiceDate: "Datum",
      invoiceDescription: "Omschrijving",
      invoiceAmount: "Bedrag",
      invoiceStatus: "Status",
      statusPaid: "Betaald",
      statusPending: "In behandeling",
      statusFailed: "Mislukt",
      paymentMethod: "Betaalmethode",
      noPaymentMethod: "Geen betaalmethode",
      manageOnStripe: "Beheren via Stripe",
      accountInfo: "Accountgegevens",
      clientSince: "Klant sinds",
      plan: "Plan",
      pageOf: "Pagina {current} van {total}",
      expires: "Verloopt",
      addedCreditsSuccess: "{n} credits succesvol toegevoegd!",
      errorBuyCredits: "Fout bij het kopen van credits",
      errorBilling: "Factureringsfout",
    },
    settings: {
      pageTitle: "Instellingen",
      pageSubtitle: "Aangepast domein, integraties en connectors",
      customDomain: "Aangepast domein",
      customDomainDesc: "Koppel je domein aan de site (bijv. www.jouwdomein.nl)",
      domainPlaceholder: "www.jouwdomein.nl",
      connectButton: "Koppelen",
      configureDns: "DNS-records instellen",
      configureDnsDesc: "Voeg deze records toe in het DNS-paneel van je domeinprovider",
      domainVerified: "Domein geverifieerd en actief",
      domainPending: "Na DNS-configuratie vindt verificatie automatisch plaats binnen 24u.",
      noCustomDomain: "Jouw site staat nu op {domain}. Koppel een aangepast domein voor een professioneler uiterlijk.",
      integrationsTitle: "Integraties en Connectors",
      integrationsDesc: "Verbind externe diensten met je site",
      connectorConnected: "Verbonden",
      connectorNotConnected: "Niet verbonden",
      getKeyLink: "Hoe krijg ik de API-sleutel?",
      saveSetting: "Opslaan",
      connDescAnalytics: "Volg bezoeken en gebruikersgedrag",
      connDescMaps: "Toon jouw locatie met een interactieve kaart",
      connDescMeta: "Volg conversies van Facebook en Instagram",
      connDescEmail: "Gebruik je e-maildomein voor meldingen",
      connDescChat: "Live chat als alternatief voor de AI-chatbot",
      connDescSsl: "Aangepast SSL-certificaat voor je domein",
      connEmailPlaceholder: "info@jouwdomein.nl",
      connEmailLabel: "Aangepaste e-mail",
      errorDomain: "Fout bij domeinconfiguratie",
    },
    reports: {
      pageTitle: "Rapporten",
      pageSubtitle: "Maandelijks prestatieoverzicht",
      noReports: "Nog geen rapporten beschikbaar",
      generateNow: "Nu genereren",
      websiteVisits: "Websitebezoeken",
      leads: "Leads",
      conversions: "Conversies",
      chatbot: "Chatbot",
      timeSaved: "Bespaarde tijd",
      insights: "Inzichten",
      recommendations: "Aanbevelingen",
      goals: "Doelen voor volgende maand",
      downloadPdf: "PDF downloaden",
      viewReport: "Rapport bekijken",
      generating: "Bezig met genereren...",
      sentOn: "Verstuurd op",
      inPreparation: "In voorbereiding",
    },
    onboarding: {
      welcome: "Welkom",
      step: "Stap",
      of: "van",
      next: "Volgende",
      finish: "Afronden",
      skip: "Overslaan",
    },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // PORTUGUESE — Brazilian
  // ────────────────────────────────────────────────────────────────────────────
  pt: {
    common: {
      loading: "Carregando...",
      error: "Erro",
      retry: "Tentar novamente",
      save: "Salvar",
      cancel: "Cancelar",
      close: "Fechar",
      back: "Voltar",
      next: "Próximo",
      confirm: "Confirmar",
      delete: "Excluir",
      edit: "Editar",
      copy: "Copiar",
      copied: "Copiado",
      search: "Buscar",
      noData: "Nenhum dado disponível",
      yes: "Sim",
      no: "Não",
      optional: "opcional",
      learnMore: "Saiba mais",
      dataUnavailable: "Dados não disponíveis",
    },
    layout: {
      loadingApp: "Carregando...",
    },
    nav: {
      dashboard: "Painel",
      editor: "Editor",
      chatbot: "Chatbot",
      reports: "Relatórios",
      settings: "Configurações",
      billing: "Faturamento",
      website: "Site",
      templates: "Templates",
      logout: "Sair",
    },
    header: {
      account: "Conta",
      profile: "Perfil",
    },
    login: {
      pageTitle: "Entrar",
      tagline: "Seu parceiro digital",
      heroHeadline: "Sua presença digital,\ntotalmente sob controle.",
      heroSubtitle: "Acompanhe visitas, leads, chatbot e faturamento — tudo em um painel.",
      heroStatClients: "Clientes ativos",
      heroStatLeads: "Leads gerados",
      heroStatUptime: "Disponibilidade",
      heroStatSatisfaction: "Satisfação",
      clientPortal: "Portal do Cliente",
      emailLabel: "Endereço de e-mail",
      emailPlaceholder: "voce@empresa.com.br",
      passwordLabel: "Senha",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Esqueceu sua senha?",
      submitButton: "Entrar",
      supportText: "Problemas para acessar?",
      supportLink: "Contatar suporte",
      showPassword: "Mostrar senha",
      hidePassword: "Ocultar senha",
      invalidCredentials: "Credenciais inválidas",
      welcomeBack: "Bem-vindo de volta",
    },
    signup: {
      pageTitle: "Cadastrar",
      heroHeadlineA: "Crie seu site",
      heroHeadlineB: "em",
      heroHeadlineHighlight: "60 segundos",
      heroSubtitle: "Conclua o cadastro para ativar seu plano.",
      heroStatSites: "Sites criados",
      heroStatTime: "Tempo médio",
      heroStatUptime: "Disponibilidade",
      heroStatSatisfaction: "Satisfação",
      formTitle: "Cadastrar — Plano",
      formSubtitle: "Conclua o cadastro para prosseguir para o pagamento",
      emailLabel: "Endereço de e-mail",
      emailPlaceholder: "voce@empresa.com.br",
      companyLabel: "Nome da empresa",
      companyPlaceholder: "Sua empresa",
      websiteLabel: "URL do site",
      websitePlaceholder: "https://www.exemplo.com.br",
      submitButton: "Prosseguir para pagamento",
      alreadyHaveAccount: "Já tem uma conta?",
      signIn: "Entrar",
      errorDefault: "Erro durante o cadastro",
      plan: "Plano",
    },
    dashboard: {
      greeting: "Olá",
      overview: "Visão geral de",
      yourSite: "Seu site",
      siteNotGenerated: "Site ainda não gerado",
      statusLive: "Ao vivo",
      statusPreparation: "Em preparação",
      editSite: "Editar seu site",
      visitsPerMonth: "Visitas / mês",
      lighthouse: "Lighthouse",
      conversations: "Conversas",
      resolutionRate: "Taxa de resolução",
      monthlyReports: "Relatórios mensais",
      seeAll: "Ver todos",
      noReportsYet: "Nenhum relatório ainda. O primeiro chegará no fim do mês.",
      inPreparation: "Em preparação",
      account: "Conta",
      status: "Status",
      statusActive: "Ativo",
      sector: "Setor",
      clientSince: "Cliente desde",
      manageAccount: "Gerenciar conta",
      errorDashboard: "Erro no painel",
    },
    editor: {
      projectName: "Editor",
      tabCode: "Código",
      tabPreview: "Visualização",
      shareButton: "Compartilhar",
      copiedButton: "Copiado",
      publishButton: "Publicar",
      chatTitle: "Chat",
      emptyStateHeadline: "O que você quer criar?",
      emptyStateSubtitle: "Descreva o site que você quer. Posso criar landing pages, e-commerces, portfólios, blogs — qualquer coisa.",
      suggestionRestaurant: "Crie um site para meu restaurante",
      suggestionEcommerce: "Crie uma loja online moderna",
      suggestionLanding: "Crie uma landing page SaaS",
      suggestionPortfolio: "Crie um portfólio fotográfico minimalista",
      inputPlaceholder: "Descreva o que você quer criar...",
      explorerLabel: "Explorador",
      noFiles: "Nenhum arquivo. Peça para a IA criar algo!",
      selectFileHint: "Selecione um arquivo para ver o código",
      toolWrite: "escrever",
      toolEdit: "editar",
      toolRead: "ler",
      toolPhotos: "fotos",
      previewDomain: "preview.madecreative.pro",
      errorConnection: "Erro de conexão. Tente novamente.",
      errorGeneric: "Erro. Tente novamente.",
      loadingPreview: "Carregando visualização...",
    },
    billing: {
      pageTitle: "Conta & Créditos",
      pageSubtitle: "Gerencie seu plano, créditos de IA e faturas",
      aiCredits: "Créditos de IA",
      creditsRemaining: "restantes",
      creditPercent: "% restante",
      extraCreditsLabel: "Inclui {n} créditos extras comprados",
      buyExtraCredits: "Comprar créditos extras",
      costChat: "Chat",
      costSimpleEdit: "Edição simples",
      costComplexEdit: "Edição complexa",
      costOpus: "Opus (premium)",
      credits: "créditos",
      currentPlan: "Plano atual",
      perMonth: "/mês",
      subscriptionActive: "Assinatura ativa",
      nextCharge: "Próxima cobrança",
      invoiceHistory: "Histórico de faturas",
      noInvoices: "Nenhuma fatura ainda",
      invoiceDate: "Data",
      invoiceDescription: "Descrição",
      invoiceAmount: "Valor",
      invoiceStatus: "Status",
      statusPaid: "Paga",
      statusPending: "Pendente",
      statusFailed: "Falhou",
      paymentMethod: "Método de pagamento",
      noPaymentMethod: "Nenhum método",
      manageOnStripe: "Gerenciar no Stripe",
      accountInfo: "Informações da conta",
      clientSince: "Cliente desde",
      plan: "Plano",
      pageOf: "Página {current} de {total}",
      expires: "Expira",
      addedCreditsSuccess: "{n} créditos adicionados com sucesso!",
      errorBuyCredits: "Erro ao comprar créditos",
      errorBilling: "Erro de faturamento",
    },
    settings: {
      pageTitle: "Configurações",
      pageSubtitle: "Domínio personalizado, integrações e conectores",
      customDomain: "Domínio personalizado",
      customDomainDesc: "Conecte seu domínio ao site (ex. www.seudominio.com.br)",
      domainPlaceholder: "www.seudominio.com.br",
      connectButton: "Conectar",
      configureDns: "Configurar registros DNS",
      configureDnsDesc: "Adicione esses registros no painel DNS do seu provedor de domínio",
      domainVerified: "Domínio verificado e ativo",
      domainPending: "Após configurar o DNS, a verificação ocorre automaticamente em até 24h.",
      noCustomDomain: "Seu site está atualmente em {domain}. Conecte um domínio personalizado para uma aparência mais profissional.",
      integrationsTitle: "Integrações e Conectores",
      integrationsDesc: "Conecte serviços externos ao seu site",
      connectorConnected: "Conectado",
      connectorNotConnected: "Não conectado",
      getKeyLink: "Como obter a chave API",
      saveSetting: "Salvar",
      connDescAnalytics: "Rastreie visitas e comportamento dos usuários",
      connDescMaps: "Exiba sua localização com um mapa interativo",
      connDescMeta: "Rastreie conversões do Facebook e Instagram",
      connDescEmail: "Use seu domínio de e-mail para notificações",
      connDescChat: "Chat ao vivo como alternativa ao chatbot de IA",
      connDescSsl: "Certificado SSL personalizado para seu domínio",
      connEmailPlaceholder: "info@seudominio.com.br",
      connEmailLabel: "E-mail personalizado",
      errorDomain: "Erro na configuração do domínio",
    },
    reports: {
      pageTitle: "Relatórios",
      pageSubtitle: "Visão geral mensal de desempenho",
      noReports: "Nenhum relatório disponível ainda",
      generateNow: "Gerar agora",
      websiteVisits: "Visitas ao site",
      leads: "Leads",
      conversions: "Conversões",
      chatbot: "Chatbot",
      timeSaved: "Tempo economizado",
      insights: "Insights",
      recommendations: "Recomendações",
      goals: "Metas para o próximo mês",
      downloadPdf: "Baixar PDF",
      viewReport: "Ver relatório",
      generating: "Gerando...",
      sentOn: "Enviado em",
      inPreparation: "Em preparação",
    },
    onboarding: {
      welcome: "Bem-vindo",
      step: "Passo",
      of: "de",
      next: "Próximo",
      finish: "Concluir",
      skip: "Pular",
    },
  },
};

// ─── Locale detection ─────────────────────────────────────────────────────────

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";

  // 1. URL query param ?lang=de
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get("lang");
  if (langParam && SUPPORTED_LOCALES.includes(langParam as Locale)) {
    return langParam as Locale;
  }

  // 2. localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  // 3. Browser navigator.language
  const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
  if (browserLang && SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // 4. Default
  return "en";
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useLocale — returns [locale, setLocale].
 * Persists selection to localStorage and keeps URL in sync.
 */
export function useLocale(): [Locale, (locale: Locale) => void] {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Initialise on mount (client only)
  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return [locale, setLocale];
}

/**
 * useTranslations — returns the full translation object for the active locale.
 */
export function useTranslations(locale: Locale): Translations {
  return translations[locale];
}

/**
 * getTranslations — non-hook version for use in server components or utilities.
 */
export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

/**
 * t — tiny interpolation helper.
 * Replaces {key} placeholders: t("Page {current} of {total}", { current: 1, total: 5 })
 */
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
