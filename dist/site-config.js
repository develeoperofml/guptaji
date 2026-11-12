/**
 * Launch / brand / SEO configuration.
 * Update these values, then run `npm run build`.
 */
export const siteConfig = {
  businessName: "Gupta Ji Tour & Travels",
  /** Live public origin with no trailing slash. */
  origin: "https://guptajitourtravel.cognivx.com",
  /** Allow search engines to index after content is client-approved. */
  allowIndexing: true,
  whatsappNumber: "919602970369",
  whatsappDisplay: "+91 96029 70369",
  /** Same business line for direct calls from mobile. */
  phoneTel: "+919602970369",
  phoneDisplay: "+91 96029 70369",
  /**
   * Monitored support inbox. Enables email fallback beside WhatsApp.
   */
  enquiryEmail: "info@cognivx.com",
  /** Instagram business profile for Gupta Ji Tour & Travels. */
  instagramUrl: "https://www.instagram.com/jaipurcarrentaltaxi/",
  instagramHandle: "@jaipurcarrentaltaxi",
  /** Digital partner / support studio. */
  linkedinUrl: "https://www.linkedin.com/company/cognivx",
  linkedinLabel: "Cognivx on LinkedIn",
  cognivxUrl: "https://cognivx.com",
  /** Support hours shown in footer / planner for international visitors. */
  supportHours: "Mon–Sat, 10:00–19:00 IST",
  /** Default display currency for India-first browsing. */
  defaultCurrency: "INR",
  /** Demonstration FX rates — not live market rates. */
  rates: { USD: 1, INR: 85, GBP: 0.79, EUR: 0.92 },
  ratesAsOf: "2026-11-12",
  ratesNote:
    "Demonstration rates for browsing only. Your written quote and payment currency govern any booking.",

  /* ─── SEO & local marketing ─── */
  locale: "en_IN",
  language: "en",
  defaultTitle:
    "Gupta Ji Tour & Travels | Jaipur Cabs, India Tours & Manali Weekend Trips",
  defaultDescription:
    "Book private cabs and custom India packages from Jaipur — Rajasthan sightseeing, Delhi–Jaipur transfers, North India hills, and Manali weekend stranger trips. Host quote on WhatsApp.",
  keywords: [
    "Jaipur tour and travels",
    "Jaipur cab booking",
    "private cab Jaipur",
    "Rajasthan tour package",
    "Delhi Jaipur cab",
    "Manali weekend trip from Delhi",
    "India outstation cab",
    "Tempo Traveller Jaipur",
    "Gupta Ji Tour Travels",
  ],
  /** Service-area business based in Jaipur (no public street office published yet). */
  address: {
    addressLocality: "Jaipur",
    addressRegion: "Rajasthan",
    addressCountry: "IN",
    postalCode: "302001",
  },
  geo: {
    latitude: 26.9124,
    longitude: 75.7873,
  },
  priceRange: "₹₹",
  /** Absolute path under origin for social share image (1200×630 ideal). */
  ogImagePath: "/assets/amber.webp",
  ogImageAlt: "Amber Fort in Jaipur at golden hour — Gupta Ji Tour & Travels",
  /**
   * Optional Google Search Console HTML tag content (meta name=google-site-verification).
   * Leave empty until you paste the code from Search Console.
   */
  googleSiteVerification: "",
  /**
   * Optional Google Analytics 4 ID (G-XXXXXXXX). Empty = no analytics script.
   * Enable only after privacy wording is approved.
   */
  gaMeasurementId: "G-7N8MZ7Q4X4",
};
