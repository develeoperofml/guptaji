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
    price: 5500,
    hint: "4 per room · best value",
  },
  {
    id: "double",
    label: "Double sharing",
    short: "Double",
    price: 6000,
    hint: "2 per room",
  },
  {
    id: "single",
    label: "Single sharing",
    short: "Single",
    price: 6500,
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
  const pickupLabel = String(pickup || "").trim() || "Delhi NCR / Jaipur (to confirm)";
  const leaveTime = strangerLeaveTime(pickupLabel);
  const guestName = String(name || "").trim();
  const extraNote = String(note || "").trim();
  const total = share.price * peopleCount;

  const lines = [
    `Hello ${businessName}! I want to book a seat on the Manali Weekend Stranger Trip.`,
    "",
    `Departure weekend: ${chosen.label}`,
    `Friday leave: ${formatWeekendLong(chosen.friday)} · ${leaveTime}`,
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

/** Friday coach leave time — Jaipur is ~5 hours before Delhi. */
export function strangerLeaveTime(pickup = "") {
  const label = String(pickup).toLowerCase();
  if (label.includes("jaipur")) return "5:00 PM";
  return "10:00 PM";
}

export const STRANGER_PICKUPS = [
  "Jaipur — agreed point (host confirms) · leave ~5:00 PM",
  "Jaipur — Railway Station / nearby · leave ~5:00 PM",
  "Delhi — ISBT Kashmere Gate · leave ~10:00 PM",
  "Delhi — Akshardham / nearby metro · leave ~10:00 PM",
  "Gurugram — IFFCO Chowk · leave ~10:00 PM",
  "Noida — Sector 18 / nearby · leave ~10:00 PM",
  "Ghaziabad — Indirapuram / nearby · leave ~10:00 PM",
  "Faridabad — nearest metro / agreed point · leave ~10:00 PM",
  "Chandigarh — Sector 43 ISBT · leave ~10:00 PM",
  "Other Delhi NCR point (I’ll share on WhatsApp) · leave ~10:00 PM",
];

/** @param {Date} date */
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Departure windows for multi-trip stranger pages.
 * @param {{ departureRule: string, nights?: number, count?: number, from?: Date }} options
 */
export function upcomingDepartures({
  departureRule = "friday",
  nights = 4,
  count = 6,
  from = new Date(),
} = {}) {
  const now = new Date(from);
  const out = [];
  const returnOffset = Math.max(1, Number(nights) || 4);

  const pushIfBookable = (depart) => {
    const start = startOfDay(depart);
    if (!isWeekendBookable(start, now) && departureRule !== "daily") {
      // Friday-style cutoff still applies for named weekdays; daily uses same cutoff logic from the leave day.
    }
    // Bookable until 01:00 the morning after departure day.
    if (new Date(now) >= weekendBookingCutoff(start)) return;
    const ret = addDays(start, returnOffset);
    out.push({
      id: toWeekendId(start),
      friday: new Date(start),
      monday: new Date(ret),
      depart: new Date(start),
      returnDate: new Date(ret),
      label: formatWeekendRange(start, ret),
      shortLabel: formatWeekendChip(start),
      longLabel: `${formatWeekendLong(start)} → ${formatWeekendLong(ret)}`,
    });
  };

  if (departureRule === "daily") {
    let cursor = startOfDay(now);
    // If past today's cutoff, start tomorrow.
    if (new Date(now) >= weekendBookingCutoff(cursor)) {
      cursor = addDays(cursor, 1);
    }
    while (out.length < count) {
      pushIfBookable(cursor);
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  if (departureRule === "saturday") {
    let sat = startOfDay(now);
    const day = sat.getDay();
    const delta = (6 - day + 7) % 7;
    sat = addDays(sat, delta === 0 && new Date(now) >= weekendBookingCutoff(sat) ? 7 : delta);
    if (sat.getDay() !== 6) sat = addDays(sat, (6 - sat.getDay() + 7) % 7);
    if (new Date(now) >= weekendBookingCutoff(sat)) sat = addDays(sat, 7);
    while (out.length < count) {
      pushIfBookable(sat);
      sat = addDays(sat, 7);
    }
    return out;
  }

  if (departureRule === "friday_saturday") {
    // Mix next Fridays and Saturdays chronologically.
    let cursor = startOfDay(now);
    let guard = 0;
    while (out.length < count && guard < 60) {
      guard += 1;
      const dow = cursor.getDay();
      if ((dow === 5 || dow === 6) && new Date(now) < weekendBookingCutoff(cursor)) {
        pushIfBookable(cursor);
      }
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  // Default: every Friday (same spine as Manali weekends, return by nights).
  let cursor = nextWeekendDeparture(now).friday;
  while (out.length < count) {
    const ret = addDays(cursor, returnOffset);
    if (isWeekendBookable(cursor, now)) {
      out.push({
        id: toWeekendId(cursor),
        friday: new Date(cursor),
        monday: new Date(ret),
        depart: new Date(cursor),
        returnDate: new Date(ret),
        label: formatWeekendRange(cursor, ret),
        shortLabel: formatWeekendChip(cursor),
        longLabel: `${formatWeekendLong(cursor)} → ${formatWeekendLong(ret)}`,
      });
    }
    cursor = addDays(cursor, 7);
  }
  return out;
}

export function findTripSharing(sharingList, id) {
  const list = Array.isArray(sharingList) && sharingList.length ? sharingList : STRANGER_SHARING;
  return list.find((option) => option.id === id) || list[0];
}

/**
 * WhatsApp booking URL for a catalog trip (not the Manali weekend page).
 */
export function tripBookingUrl({
  trip,
  whatsappNumber,
  businessName,
  departureId,
  people,
  pickup,
  sharing,
  name,
  note,
} = {}) {
  const departures = upcomingDepartures({
    departureRule: trip?.departureRule || "friday",
    nights: trip?.nights || 4,
    count: 8,
  });
  const chosen =
    departures.find((item) => item.id === departureId) || departures[0];
  const share = findTripSharing(trip?.sharing, sharing);
  const peopleCount = Math.max(1, Math.min(12, Number(people) || 1));
  const pickupLabel = String(pickup || "").trim() || "Delhi NCR / Jaipur (to confirm)";
  const leaveTime = strangerLeaveTime(pickupLabel);
  const guestName = String(name || "").trim();
  const extraNote = String(note || "").trim();
  const total = share.price * peopleCount;
  const tripName = trip?.name || "Stranger Trip";

  const lines = [
    `Hello ${businessName}! I want to book a seat on the ${tripName} Stranger Trip.`,
    "",
    `Departure: ${chosen.label}`,
    `Leave day: ${formatWeekendLong(chosen.depart || chosen.friday)} · ${leaveTime}`,
    `Return window: ${formatWeekendLong(chosen.returnDate || chosen.monday)}`,
    `Duration: ${trip?.durationLabel || ""}`,
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

export function tripEnquireUrl(trip, whatsappNumber, businessName) {
  return tripBookingUrl({ trip, whatsappNumber, businessName });
}
