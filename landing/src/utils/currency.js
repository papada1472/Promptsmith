/**
 * Currency & Geolocation Localization Engine for Refinzi 2.0
 * 
 * Automatically detects user country and serves localized pricing with symbols,
 * purchasing power parity (PPP) calibration, and instant manual toggle.
 */

export const SUPPORTED_CURRENCIES = {
  INR: {
    code: "INR",
    symbol: "₹",
    flag: "🇮🇳",
    name: "Indian Rupee",
    price: 999,
    regularPrice: 3699,
    saveAmount: 2700,
    formattedPrice: "₹999",
    formattedRegular: "₹3,699",
  },
  USD: {
    code: "USD",
    symbol: "$",
    flag: "🇺🇸",
    name: "US Dollar",
    price: 12,
    regularPrice: 45,
    saveAmount: 33,
    formattedPrice: "$12",
    formattedRegular: "$45",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    flag: "🇪🇺",
    name: "Euro",
    price: 11,
    regularPrice: 42,
    saveAmount: 31,
    formattedPrice: "€11",
    formattedRegular: "€42",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    flag: "🇬🇧",
    name: "British Pound",
    price: 9.99,
    regularPrice: 38,
    saveAmount: 28,
    formattedPrice: "£9.99",
    formattedRegular: "£38",
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    flag: "🇨🇦",
    name: "Canadian Dollar",
    price: 16,
    regularPrice: 59,
    saveAmount: 43,
    formattedPrice: "CA$16",
    formattedRegular: "CA$59",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    flag: "🇦🇺",
    name: "Australian Dollar",
    price: 18,
    regularPrice: 69,
    saveAmount: 51,
    formattedPrice: "A$18",
    formattedRegular: "A$69",
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    flag: "🇯🇵",
    name: "Japanese Yen",
    price: 1800,
    regularPrice: 6900,
    saveAmount: 5100,
    formattedPrice: "¥1,800",
    formattedRegular: "¥6,900",
  },
  BRL: {
    code: "BRL",
    symbol: "R$",
    flag: "🇧🇷",
    name: "Brazilian Real",
    price: 65,
    regularPrice: 249,
    saveAmount: 184,
    formattedPrice: "R$65",
    formattedRegular: "R$249",
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    flag: "🇸🇬",
    name: "Singapore Dollar",
    price: 16,
    regularPrice: 59,
    saveAmount: 43,
    formattedPrice: "S$16",
    formattedRegular: "S$59",
  },
  AED: {
    code: "AED",
    symbol: "AED ",
    flag: "🇦🇪",
    name: "UAE Dirham",
    price: 44,
    regularPrice: 169,
    saveAmount: 125,
    formattedPrice: "AED 44",
    formattedRegular: "AED 169",
  },
};

/**
 * Fast client-side timezone & locale country mapping (zero network latency)
 */
export function detectLocalCurrencyOffline() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = (navigator.language || "").toLowerCase();

    // India
    if (tz.includes("Calcutta") || tz.includes("Kolkata") || lang.endsWith("-in")) {
      return { currency: SUPPORTED_CURRENCIES.INR, country: "India", countryCode: "IN" };
    }
    // UK
    if (tz.includes("London") || lang.endsWith("-gb")) {
      return { currency: SUPPORTED_CURRENCIES.GBP, country: "United Kingdom", countryCode: "GB" };
    }
    // Eurozone
    if (
      tz.includes("Berlin") ||
      tz.includes("Paris") ||
      tz.includes("Rome") ||
      tz.includes("Madrid") ||
      tz.includes("Amsterdam") ||
      tz.includes("Brussels") ||
      tz.includes("Vienna") ||
      tz.includes("Dublin")
    ) {
      return { currency: SUPPORTED_CURRENCIES.EUR, country: "Europe", countryCode: "EU" };
    }
    // Canada
    if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Montreal") || lang.endsWith("-ca")) {
      return { currency: SUPPORTED_CURRENCIES.CAD, country: "Canada", countryCode: "CA" };
    }
    // Australia
    if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Brisbane") || lang.endsWith("-au")) {
      return { currency: SUPPORTED_CURRENCIES.AUD, country: "Australia", countryCode: "AU" };
    }
    // Japan
    if (tz.includes("Tokyo") || lang.startsWith("ja")) {
      return { currency: SUPPORTED_CURRENCIES.JPY, country: "Japan", countryCode: "JP" };
    }
    // Brazil
    if (tz.includes("Sao_Paulo") || lang.endsWith("-br")) {
      return { currency: SUPPORTED_CURRENCIES.BRL, country: "Brazil", countryCode: "BR" };
    }
    // Singapore
    if (tz.includes("Singapore") || lang.endsWith("-sg")) {
      return { currency: SUPPORTED_CURRENCIES.SGD, country: "Singapore", countryCode: "SG" };
    }
    // UAE
    if (tz.includes("Dubai") || tz.includes("Muscat")) {
      return { currency: SUPPORTED_CURRENCIES.AED, country: "UAE", countryCode: "AE" };
    }
  } catch (e) {
    // Fallback to USD
  }

  return { currency: SUPPORTED_CURRENCIES.USD, country: "United States", countryCode: "US" };
}

/**
 * Hook or helper for async IP detection with fallback
 */
export async function detectCountryAndCurrencyAsync() {
  const offlineResult = detectLocalCurrencyOffline();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch("https://api.country.is/", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const countryCode = data.country;

      if (countryCode === "IN") return { currency: SUPPORTED_CURRENCIES.INR, country: "India", countryCode: "IN" };
      if (countryCode === "GB") return { currency: SUPPORTED_CURRENCIES.GBP, country: "United Kingdom", countryCode: "GB" };
      if (["DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "FI", "GR"].includes(countryCode)) {
        return { currency: SUPPORTED_CURRENCIES.EUR, country: "Europe", countryCode: countryCode };
      }
      if (countryCode === "CA") return { currency: SUPPORTED_CURRENCIES.CAD, country: "Canada", countryCode: "CA" };
      if (countryCode === "AU") return { currency: SUPPORTED_CURRENCIES.AUD, country: "Australia", countryCode: "AU" };
      if (countryCode === "JP") return { currency: SUPPORTED_CURRENCIES.JPY, country: "Japan", countryCode: "JP" };
      if (countryCode === "BR") return { currency: SUPPORTED_CURRENCIES.BRL, country: "Brazil", countryCode: "BR" };
      if (countryCode === "SG") return { currency: SUPPORTED_CURRENCIES.SGD, country: "Singapore", countryCode: "SG" };
      if (countryCode === "AE") return { currency: SUPPORTED_CURRENCIES.AED, country: "UAE", countryCode: "AE" };
      if (countryCode === "US") return { currency: SUPPORTED_CURRENCIES.USD, country: "United States", countryCode: "US" };
    }
  } catch (e) {
    // Return offline detected
  }

  return offlineResult;
}
