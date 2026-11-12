/** Shared weekend-departure helpers for Stranger Trips. */

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Saturday 1:00 AM after a Friday departure.
 * Until then the weekend stays on the booking calendar;
 * after that it is removed and only later weekends show.
 */
export function weekendBookingCutoff(friday) {
  const cutoff = startOfDay(friday);
  cutoff.setDate(cutoff.getDate() + 1);
  cutoff.setHours(1, 0, 0, 0);
  return cutoff;
}

export function isWeekendBookable(friday, from = new Date()) {
  return new Date(from) < weekendBookingCutoff(friday);
}

/**
 * Next bookable Friday departure.
 * Keeps “this Friday” through Friday night and early Saturday,
 * then drops it automatically at Saturday 01:00.
 */
export function nextWeekendDeparture(from = new Date()) {
  const now = new Date(from);
  const friday = startOfDay(now);
  const day = friday.getDay();

  // Anchor to the Friday of the current trip window.
  if (day === 0) friday.setDate(friday.getDate() - 2); // Sun → last Fri
  else if (day === 6) friday.setDate(friday.getDate() - 1); // Sat → Fri
  else friday.setDate(friday.getDate() + (5 - day)); // Mon–Fri → this Fri

  if (!isWeekendBookable(friday, now)) {
    friday.setDate(friday.getDate() + 7);
  }

  const monday = new Date(friday);
  monday.setDate(friday.getDate() + 3);
  return { friday, monday };
}

/** Upcoming Friday–Monday windows for booking chips (past cutoffs excluded). */
export function upcomingWeekends(count = 6, from = new Date()) {
  const weekends = [];
  let cursor = nextWeekendDeparture(from);
  while (weekends.length < count) {
    if (isWeekendBookable(cursor.friday, from)) {
      weekends.push({
        id: toWeekendId(cursor.friday),
        friday: new Date(cursor.friday),
        monday: new Date(cursor.monday),
        label: formatWeekendRange(cursor.friday, cursor.monday),
        shortLabel: formatWeekendChip(cursor.friday),
        longLabel: `${formatWeekendLong(cursor.friday)} → ${formatWeekendLong(cursor.monday)}`,
      });
    }
    const nextFriday = new Date(cursor.friday);
    nextFriday.setDate(nextFriday.getDate() + 7);
    const monday = new Date(nextFriday);
    monday.setDate(nextFriday.getDate() + 3);
    cursor = { friday: nextFriday, monday };
  }
  return weekends;
}

export function toWeekendId(friday) {
  const y = friday.getFullYear();
  const m = String(friday.getMonth() + 1).padStart(2, "0");
  const d = String(friday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatWeekendRange(friday, monday) {
  const opts = { day: "numeric", month: "short" };
  return `${friday.toLocaleDateString("en-IN", opts)} – ${monday.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
}

export function formatWeekendChip(friday) {
  return friday.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatWeekendLong(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function strangerEnquireUrl(whatsappNumber, businessName) {
  return strangerBookingUrl({
    whatsappNumber,
    businessName,
  });
}

/** Room-sharing price card for the Manali weekend stranger trip (INR / person). */
export const STRANGER_SHARING = [
  {
    id: "quad",
    label: "Quad sharing",
    short: "Quad",
    price: 6500,
    hint: "4 per room · best value",
  },
  {
    id: "double",
    label: "Double sharing",
    short: "Double",
    price: 7000,
    hint: "2 per room",
  },
  {
    id: "single",
    label: "Single sharing",
    short: "Single",
    price: 7500,
    hint: "Private room",
  },
];

export function formatInr(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function findSharing(id) {
  return (
    STRANGER_SHARING.find((option) => option.id === id) || STRANGER_SHARING[0]
  );
}

/**
 * Build a WhatsApp enquiry with booking details.
 * @param {{
 *   whatsappNumber: string,
 *   businessName: string,
 *   weekendId?: string,
 *   people?: number|string,
 *   pickup?: string,
 *   sharing?: string,
 *   name?: string,
 *   note?: string,
 * }} options
 */
export function strangerBookingUrl({
  whatsappNumber,
  businessName,
  weekendId,
  people,
  pickup,
  sharing,
  name,
  note,
} = {}) {
  const weekends = upcomingWeekends(8);
  const chosen =
    weekends.find((weekend) => weekend.id === weekendId) || weekends[0];
  const share = findSharing(sharing);
  const peopleCount = Math.max(1, Math.min(12, Number(people) || 1));
  const pickupLabel = String(pickup || "").trim() || "Delhi NCR (to confirm)";
  const guestName = String(name || "").trim();
  const extraNote = String(note || "").trim();
  const total = share.price * peopleCount;

  const lines = [
    `Hello ${businessName}! I want to book a seat on the Manali Weekend Stranger Trip.`,
    "",
    `Departure weekend: ${chosen.label}`,
    `Friday leave: ${formatWeekendLong(chosen.friday)} · 10:00 PM`,
    `Monday return window: ${formatWeekendLong(chosen.monday)}`,
    `Travellers: ${peopleCount}`,
    `Room sharing: ${share.label} · ${formatInr(share.price)} per person`,
    `Approx total: ${formatInr(total)} (for ${peopleCount})`,
    `Pickup point: ${pickupLabel}`,
    "Meals: Breakfast & dinner included",
  ];

  if (guestName) lines.push(`Name: ${guestName}`);
  if (extraNote) lines.push(`Note: ${extraNote}`);

  lines.push(
    "",
    "Please confirm seat availability, exact pickup time, and final booking details.",
  );

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export const STRANGER_PICKUPS = [
  "Delhi — ISBT Kashmere Gate",
  "Delhi — Akshardham / nearby metro",
  "Gurugram — IFFCO Chowk",
  "Noida — Sector 18 / nearby",
  "Ghaziabad — Indirapuram / nearby",
  "Faridabad — nearest metro / agreed point",
  "Chandigarh — Sector 43 ISBT",
  "Other Delhi NCR point (I’ll share on WhatsApp)",
];
