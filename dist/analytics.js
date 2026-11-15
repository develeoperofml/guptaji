/**
 * GA4 helpers for lead / WhatsApp / PDF tracking.
 * Safe no-op when gtag is absent (local preview without analytics).
 */

function pagePath() {
  try {
    return location.pathname || "";
  } catch {
    return "";
  }
}

export function trackEvent(name, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

/** Recommended GA4 conversion-style lead event. Mark as Key event in Admin. */
export function trackLead({ method = "whatsapp", cta = "" } = {}) {
  trackEvent("generate_lead", {
    method,
    cta: String(cta).slice(0, 80),
    page_path: pagePath(),
  });
}

export function trackWhatsAppClick({ cta = "" } = {}) {
  const label = String(cta).slice(0, 80) || "whatsapp_link";
  trackLead({ method: "whatsapp", cta: label });
  trackEvent("whatsapp_click", {
    cta: label,
    page_path: pagePath(),
  });
}

export function trackBookSeat({
  pickup = "",
  sharing = "",
  people = 0,
  weekendId = "",
} = {}) {
  trackLead({ method: "book_form", cta: "stranger_book_submit" });
  trackEvent("book_seat", {
    pickup: String(pickup).slice(0, 80),
    sharing: String(sharing).slice(0, 40),
    people: Number(people) || 0,
    weekend_id: String(weekendId).slice(0, 40),
    page_path: pagePath(),
  });
}

export function trackPdfDownload({ fileName = "", href = "" } = {}) {
  trackEvent("file_download", {
    file_name: String(fileName).slice(0, 120),
    file_extension: "pdf",
    link_url: String(href).slice(0, 200),
    page_path: pagePath(),
  });
}

export function trackPhoneClick({ cta = "call" } = {}) {
  trackEvent("phone_click", {
    cta: String(cta).slice(0, 80),
    page_path: pagePath(),
  });
}

function linkCta(anchor) {
  return (
    anchor.getAttribute("data-analytics-cta") ||
    anchor.id ||
    (anchor.classList.contains("whatsapp-float") ? "whatsapp_float" : "") ||
    (anchor.classList.contains("stranger-mobile-bar") ? "mobile_book_bar" : "") ||
    anchor.textContent.replace(/\s+/g, " ").trim().slice(0, 40) ||
    "link"
  );
}

/**
 * Capture WhatsApp / PDF / tel clicks site-wide (including dynamic links).
 * Uses capture phase so the event still fires before navigation.
 */
export function bindLeadTracking() {
  if (typeof document === "undefined") return;
  if (document.documentElement.dataset.gaLeadBound === "1") return;
  document.documentElement.dataset.gaLeadBound = "1";

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";

      if (/wa\.me\//i.test(href) || /api\.whatsapp\.com/i.test(href)) {
        trackWhatsAppClick({ cta: linkCta(anchor) });
        return;
      }

      if (/^tel:/i.test(href)) {
        trackPhoneClick({ cta: linkCta(anchor) });
        return;
      }

      if (/\.pdf([?#]|$)/i.test(href)) {
        const fileName =
          anchor.getAttribute("download") ||
          href.split("/").pop()?.split(/[?#]/)[0] ||
          "download.pdf";
        trackPdfDownload({ fileName, href });
      }
    },
    true,
  );
}
