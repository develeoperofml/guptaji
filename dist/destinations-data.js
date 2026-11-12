/** Searchable places, region maps, currency sync, and indicative India rates. */

export const countryCurrency = {
  IN: "INR",
  JP: "USD",
  ID: "USD",
  IT: "EUR",
  CH: "EUR",
  KE: "USD",
  GB: "GBP",
  US: "USD",
};

/** Approx outstation per-km ranges researched from Jaipur market operators (2026). Final quote after host discussion. */
export const vehicleRatesInr = {
  sedan: { from: 11, to: 13, label: "Sedan · 5 seater", seats: "4 guests" },
  ertiga: { from: 14, to: 16, label: "Ertiga · 7 seater", seats: "6 guests" },
  innova: { from: 17, to: 20, label: "Innova · 7 seater", seats: "6–7 guests" },
  traveller: {
    from: 23,
    to: 27,
    label: "Tempo Traveller",
    seats: "12–17 guests",
  },
  urbania: {
    from: 30,
    to: 35,
    label: "Force Urbania",
    seats: "9–17 guests",
  },
};

/** Approx full-package starting points in INR per person (indicative only). */
export const packageApproxInr = {
  day: { from: 2490, to: 4990, unit: "per person / day" },
  short: { from: 8990, to: 18990, unit: "per person" },
  multi: { from: 18990, to: 45990, unit: "per person" },
};

/** Quick region chips — shortcuts only; search covers all India. */
export const indiaRegions = [
  {
    id: "rajasthan",
    name: "Rajasthan",
    cities: [
      "Jaipur",
      "Udaipur",
      "Jodhpur",
      "Jaisalmer",
      "Ajmer",
      "Pushkar",
      "Bikaner",
      "Mount Abu",
      "Chittorgarh",
      "Ranthambore",
      "Kota",
      "Alwar",
      "Bharatpur",
      "Sawai Madhopur",
      "Bundi",
      "Nagaur",
    ],
  },
  {
    id: "up",
    name: "Uttar Pradesh",
    cities: [
      "Agra",
      "Varanasi",
      "Mathura",
      "Vrindavan",
      "Lucknow",
      "Prayagraj",
      "Ayodhya",
      "Fatehpur Sikri",
      "Kanpur",
      "Ghaziabad",
      "Noida",
      "Meerut",
      "Bareilly",
      "Gorakhpur",
      "Jhansi",
      "Vindhyachal",
    ],
  },
  {
    id: "punjab",
    name: "Punjab",
    cities: [
      "Amritsar",
      "Chandigarh",
      "Ludhiana",
      "Jalandhar",
      "Patiala",
      "Mohali",
      "Bathinda",
      "Pathankot",
      "Anandpur Sahib",
    ],
  },
  {
    id: "hp",
    name: "Himachal Pradesh",
    cities: [
      "Shimla",
      "Manali",
      "Dharamshala",
      "McLeod Ganj",
      "Kasol",
      "Spiti",
      "Kullu",
      "Dalhousie",
      "Kasauli",
      "Chamba",
      "Bir Billing",
      "Sangla",
      "Kalpa",
    ],
  },
  {
    id: "uk",
    name: "Uttarakhand",
    cities: [
      "Rishikesh",
      "Haridwar",
      "Dehradun",
      "Mussoorie",
      "Nainital",
      "Jim Corbett",
      "Auli",
      "Kedarnath",
      "Badrinath",
      "Chopta",
      "Almora",
      "Ranikhet",
      "Haldwani",
    ],
  },
  {
    id: "jk",
    name: "Jammu & Kashmir",
    cities: [
      "Srinagar",
      "Gulmarg",
      "Pahalgam",
      "Sonamarg",
      "Jammu",
      "Leh",
      "Katra",
      "Vaishno Devi",
      "Nubra Valley",
      "Pangong",
    ],
  },
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    cities: [
      "New Delhi",
      "Delhi",
      "Gurugram",
      "Noida",
      "Faridabad",
      "Ghaziabad",
      "Greater Noida",
      "Dwarka",
      "Airport T3",
    ],
  },
];

/** Broad India place catalog for pan-India pickup/drop search. */
export const indiaStatePlaces = [
  ...indiaRegions,
  {
    id: "haryana",
    name: "Haryana",
    cities: [
      "Gurugram",
      "Faridabad",
      "Chandigarh",
      "Kurukshetra",
      "Karnal",
      "Panipat",
      "Hisar",
      "Ambala",
      "Manesar",
      "Sonipat",
    ],
  },
  {
    id: "mp",
    name: "Madhya Pradesh",
    cities: [
      "Bhopal",
      "Indore",
      "Gwalior",
      "Ujjain",
      "Khajuraho",
      "Jabalpur",
      "Orchha",
      "Sanchi",
      "Pachmarhi",
      "Mandu",
    ],
  },
  {
    id: "gujarat",
    name: "Gujarat",
    cities: [
      "Ahmedabad",
      "Surat",
      "Vadodara",
      "Rajkot",
      "Gandhinagar",
      "Dwarka",
      "Somnath",
      "Bhuj",
      "Junagadh",
      "Statue of Unity",
      "Saputara",
    ],
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    cities: [
      "Mumbai",
      "Pune",
      "Nagpur",
      "Nashik",
      "Aurangabad",
      "Shirdi",
      "Lonavala",
      "Mahabaleshwar",
      "Kolhapur",
      "Alibaug",
      "Lavasa",
    ],
  },
  {
    id: "goa",
    name: "Goa",
    cities: [
      "Panaji",
      "Calangute",
      "Baga",
      "Anjuna",
      "Vasco da Gama",
      "Madgaon",
      "Candolim",
      "Palolem",
    ],
  },
  {
    id: "karnataka",
    name: "Karnataka",
    cities: [
      "Bengaluru",
      "Mysuru",
      "Hampi",
      "Coorg",
      "Mangaluru",
      "Gokarna",
      "Chikmagalur",
      "Hubballi",
      "Belur",
      "Halebidu",
    ],
  },
  {
    id: "kerala",
    name: "Kerala",
    cities: [
      "Kochi",
      "Thiruvananthapuram",
      "Munnar",
      "Alleppey",
      "Kovalam",
      "Thekkady",
      "Wayanad",
      "Kozhikode",
      "Varkala",
      "Kumarakom",
    ],
  },
  {
    id: "tn",
    name: "Tamil Nadu",
    cities: [
      "Chennai",
      "Madurai",
      "Coimbatore",
      "Ooty",
      "Kodaikanal",
      "Rameswaram",
      "Kanyakumari",
      "Pondicherry",
      "Mahabalipuram",
      "Thanjavur",
    ],
  },
  {
    id: "telangana",
    name: "Telangana",
    cities: ["Hyderabad", "Warangal", "Secunderabad", "Nizamabad", "Khammam"],
  },
  {
    id: "ap",
    name: "Andhra Pradesh",
    cities: [
      "Visakhapatnam",
      "Vijayawada",
      "Tirupati",
      "Amaravati",
      "Guntur",
      "Nellore",
      "Araku Valley",
    ],
  },
  {
    id: "wb",
    name: "West Bengal",
    cities: [
      "Kolkata",
      "Darjeeling",
      "Siliguri",
      "Kalimpong",
      "Digha",
      "Sundarbans",
      "Howrah",
      "Shantiniketan",
    ],
  },
  {
    id: "bihar",
    name: "Bihar",
    cities: [
      "Patna",
      "Gaya",
      "Bodh Gaya",
      "Nalanda",
      "Rajgir",
      "Muzaffarpur",
      "Bhagalpur",
    ],
  },
  {
    id: "odisha",
    name: "Odisha",
    cities: [
      "Bhubaneswar",
      "Puri",
      "Konark",
      "Cuttack",
      "Chilika",
      "Gopalpur",
      "Sambalpur",
    ],
  },
  {
    id: "assam",
    name: "Assam",
    cities: [
      "Guwahati",
      "Kaziranga",
      "Tezpur",
      "Jorhat",
      "Silchar",
      "Majuli",
      "Dibrugarh",
    ],
  },
  {
    id: "northeast",
    name: "North East",
    cities: [
      "Shillong",
      "Gangtok",
      "Pelling",
      "Lachung",
      "Imphal",
      "Aizawl",
      "Kohima",
      "Itanagar",
      "Agartala",
      "Tawang",
    ],
  },
  {
    id: "chhattisgarh",
    name: "Chhattisgarh",
    cities: ["Raipur", "Bilaspur", "Jagdalpur", "Bastar"],
  },
  {
    id: "jharkhand",
    name: "Jharkhand",
    cities: ["Ranchi", "Jamshedpur", "Deoghar", "Netarhat", "Hazaribagh"],
  },
  {
    id: "airports",
    name: "Airports & hubs",
    cities: [
      "Jaipur Airport",
      "Delhi Airport",
      "Mumbai Airport",
      "Bengaluru Airport",
      "Hyderabad Airport",
      "Ahmedabad Airport",
      "Lucknow Airport",
      "Chandigarh Airport",
      "Goa Airport",
      "Kolkata Airport",
    ],
  },
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeIndiaPlace(city, region = "India", extras = {}) {
  const cleaned = String(city || "").trim();
  const label =
    region && region !== "India" && !cleaned.includes(",")
      ? `${cleaned}, ${region}`
      : cleaned;
  return {
    // Custom typed places use the label as id so free-text routes stay recoverable.
    id: extras.custom ? label : extras.id || `in-${slugify(label)}`,
    label,
    country: "India",
    countryCode: "IN",
    region,
    keywords: `${cleaned} ${region} india ${extras.keywords || ""}`.trim(),
    packageType: extras.packageType || "short",
    filterCountry: "India",
    custom: Boolean(extras.custom),
  };
}

const catalogPlaces = indiaStatePlaces.flatMap((region) =>
  region.cities.map((city) =>
    makeIndiaPlace(city, region.name, {
      id: `${region.id}-${slugify(city)}`,
      packageType:
        region.id === "rajasthan" || region.id === "delhi-ncr" ? "day" : "short",
    }),
  ),
);

export const searchablePlaces = [
  {
    id: "india-anywhere",
    label: "India · travel anywhere",
    country: "India",
    countryCode: "IN",
    region: "All India",
    keywords: "india anywhere pan india outstation cab package from jaipur any city",
    packageType: "short",
    filterCountry: "India",
  },
  {
    id: "india-jaipur",
    label: "Jaipur",
    country: "India",
    countryCode: "IN",
    region: "Rajasthan",
    keywords: "jaipur pink city rajasthan sightseeing local day pickup",
    packageType: "day",
    filterCountry: "India",
  },
  {
    id: "delhi",
    label: "Delhi / New Delhi",
    country: "India",
    countryCode: "IN",
    region: "Delhi NCR",
    keywords: "delhi ncr capital sightseeing",
    packageType: "day",
    filterCountry: "India",
  },
  {
    id: "golden-triangle",
    label: "Golden Triangle · Delhi–Agra–Jaipur",
    country: "India",
    countryCode: "IN",
    region: "North India",
    keywords: "golden triangle agra taj",
    packageType: "multi",
    filterCountry: "India",
  },
  ...catalogPlaces,
  {
    id: "japan",
    label: "Japan",
    country: "Japan",
    countryCode: "JP",
    region: "International",
    keywords: "japan tokyo kyoto",
    packageType: "multi",
    filterCountry: "Japan",
  },
  {
    id: "bali",
    label: "Bali, Indonesia",
    country: "Indonesia",
    countryCode: "ID",
    region: "International",
    keywords: "bali indonesia",
    packageType: "multi",
    filterCountry: "Bali",
  },
  {
    id: "italy",
    label: "Italy",
    country: "Italy",
    countryCode: "IT",
    region: "International",
    keywords: "italy rome venice",
    packageType: "multi",
    filterCountry: "Italy",
  },
  {
    id: "switzerland",
    label: "Switzerland",
    country: "Switzerland",
    countryCode: "CH",
    region: "International",
    keywords: "switzerland alps",
    packageType: "multi",
    filterCountry: "Switzerland",
  },
  {
    id: "kenya",
    label: "Kenya",
    country: "Kenya",
    countryCode: "KE",
    region: "International",
    keywords: "kenya safari",
    packageType: "multi",
    filterCountry: "Kenya",
  },
];

const placeIndex = new Map();
for (const place of searchablePlaces) {
  placeIndex.set(place.id, place);
  placeIndex.set(place.label.toLowerCase(), place);
}

export function findPlace(idOrLabel) {
  if (!idOrLabel) return searchablePlaces[0];
  const key = String(idOrLabel).trim();
  if (!key) return searchablePlaces[0];
  return (
    placeIndex.get(key) ||
    placeIndex.get(key.toLowerCase()) ||
    searchablePlaces.find(
      (place) =>
        place.id === key || place.label.toLowerCase() === key.toLowerCase(),
    ) ||
    makeIndiaPlace(key, "India", { custom: true })
  );
}

export function searchPlaces(query, { indiaOnly = true, limit = 16 } = {}) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  const pool = indiaOnly
    ? searchablePlaces.filter((place) => place.countryCode === "IN")
    : searchablePlaces;

  if (!q) return pool.slice(0, Math.min(12, limit));

  const scored = pool
    .map((place) => {
      const hay = `${place.label} ${place.region} ${place.keywords}`.toLowerCase();
      let score = 0;
      if (place.label.toLowerCase() === q) score = 100;
      else if (place.label.toLowerCase().startsWith(q)) score = 80;
      else if (place.label.toLowerCase().includes(q)) score = 60;
      else if (hay.includes(q)) score = 40;
      else return null;
      return { place, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.place.label.localeCompare(b.place.label));

  const results = scored.slice(0, limit).map((item) => item.place);
  const exact = results.some(
    (place) => place.label.toLowerCase() === q || place.label.toLowerCase().startsWith(q),
  );

  // Always allow any typed Indian place — not limited to the catalog.
  if (!exact && q.length >= 2) {
    const custom = makeIndiaPlace(String(query).trim(), "India", {
      custom: true,
      keywords: "custom typed any city india",
    });
    results.unshift(custom);
  }

  return results.slice(0, limit);
}
