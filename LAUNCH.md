# Launch checklist — Gupta Ji Tour & Travels

Use this before making the site public. Items marked **Done in code** are already prepared; remaining items need client decisions or content.

## Phase 0 — Already improved in this pass

- [x] Accessibility: brand and WhatsApp control names match visible labels
- [x] SEO scaffolding: `robots.txt`, `sitemap.xml`, richer Open Graph / Twitter tags, expanded TravelAgency schema
- [x] Site config: single place for domain, indexing flag, WhatsApp, optional email, currency rate date
- [x] Enquiry fallback: optional email / mailto when a business email is configured
- [x] Production build: `npm run build` writes a minified `release/` folder
- [x] Static asset caching headers on the local server for images and fonts
- [x] Clearer “indicative / demonstration rate” currency messaging

## Phase 1 — Client must supply / approve

- [ ] Confirm legal business name, logo, and brand colours
- [ ] Confirm WhatsApp business number ownership (`+91 96029 70369`)
- [ ] Provide a monitored business email for enquiries (set `enquiryEmail` in `dist/site-config.js`)
- [ ] Replace illustrative journeys in `dist/data.js` with real packages, prices, inclusions, exclusions, and dates
- [ ] Replace or license photography that matches sold destinations
- [ ] Approve privacy policy, booking terms, cancellation rules, and business address
- [ ] Confirm final public domain (set `origin` in `dist/site-config.js` and rebuild)

## Phase 2 — Flip to public SEO

- [x] Set `allowIndexing: true` in `dist/site-config.js` (live: `https://guptajitourtravel.cognivx.com`)
- [x] Indexable robots meta via build (`index, follow…`)
- [x] `robots.txt` Allow + sitemap; `sitemap.xml` for home + stranger trips
- [x] Absolute Open Graph / Twitter / canonical / hreflang URLs
- [x] TravelAgency + LocalBusiness + FAQPage + Product / TouristTrip JSON-LD
- [x] Web app manifest, humans.txt, security/cache headers on Vercel
- [ ] **You:** Google Search Console → Add URL property → paste verification into `googleSiteVerification` → rebuild → Submit `sitemap.xml`
- [ ] **You:** Bing Webmaster Tools → import from Google or submit sitemap
- [ ] **You:** Claim / complete Google Business Profile (Travel Agency, Jaipur) with matching NAP + photos + reviews
- [ ] Optional: set `gaMeasurementId` (GA4) only after privacy wording is approved
- [ ] Optional: export a 1200×630 JPG share card (OG prefers JPG on some older apps; WebP works on modern networks)

## Phase 3 — International readiness

- [ ] Decide languages beyond English (do not expose a language picker until translations exist)
- [ ] Replace demonstration FX rates with a maintained rate source or remove conversion and show one quote currency
- [ ] Publish support hours with timezone (e.g. IST) for international callers
- [ ] Confirm phone / WhatsApp response SLA for overseas travellers

## Phase 4 — Booking & operations (optional upgrade)

- [ ] Choose whether WhatsApp enquiry remains the only conversion path
- [ ] If online booking is required: pick provider (Razorpay / Stripe / booking engine), connect inventory, test confirmations and failures
- [ ] Connect CRM or shared inbox so enquiries are never missed
- [ ] Add analytics only after privacy wording is approved (avoid cookie walls on first paint)

## Phase 5 — Pre-launch QA

- [ ] Run `npm run check` and `npm run build`
- [ ] Test desktop, tablet, and mobile enquiry → WhatsApp (and email if configured)
- [ ] Verify favourites, currency selector, filters, dialogs, and reduced-motion
- [ ] Lighthouse pass on production URL (Performance / Accessibility / Best Practices / SEO)
- [ ] Remove “WEBSITE PREVIEW” badge only after content is approved
- [ ] Soft launch to a small audience before paid marketing

## Commands

```sh
npm run dev      # edit/preview from dist/
npm run check    # syntax check
npm run build    # minify into release/ for hosting
```

Host the contents of `release/` (or `dist/` during preview) on your domain.
