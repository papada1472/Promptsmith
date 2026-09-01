/**
 * Currency & Geolocation Localization Engine for Refinzi 2.0
 * 
 * Automatically detects user country and serves localized pricing with symbols,
 * purchasing power parity (PPP) calibration, and instant manual toggle.
 */

export const SUPPORTED_CURRENCIES = {
  USD: {
    code: "USD",
    symbol: "$",
    flag: "🇺🇸",
    name: "US Dollar",
    price: 19,
    regularPrice: 79,
    saveAmount: 60,
    formattedPrice: "$19",
    formattedRegular: "$79",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    flag: "🇮🇳",
    name: "Indian Rupee",
    price: 1499,
    regularPrice: 5999,
    saveAmount: 4500,
    formattedPrice: "₹1,499",
    formattedRegular: "₹5,999",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    flag: "🇪🇺",
    name: "Euro",
    price: 18,
    regularPrice: 75,
    saveAmount: 57,
    formattedPrice: "€18",
    formattedRegular: "€75",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    flag: "🇬🇧",
    name: "British Pound",
    price: 15,
    regularPrice: 65,
    saveAmount: 50,
    formattedPrice: "£15",
    formattedRegular: "£65",
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    flag: "🇨🇦",
    name: "Canadian Dollar",
    price: 26,
    regularPrice: 109,
    saveAmount: 83,
    formattedPrice: "CA$26",
    formattedRegular: "CA$109",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    flag: "🇦🇺",
    name: "Australian Dollar",
    price: 29,
    regularPrice: 119,
    saveAmount: 90,
    formattedPrice: "A$29",
    formattedRegular: "A$119",
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    flag: "🇯🇵",
    name: "Japanese Yen",
    price: 2900,
    regularPrice: 11900,
    saveAmount: 9000,
    formattedPrice: "¥2,900",
    formattedRegular: "¥11,900",
  },
  BRL: {
    code: "BRL",
    symbol: "R$",
    flag: "🇧🇷",
    name: "Brazilian Real",
    price: 99,
    regularPrice: 399,
    saveAmount: 300,
    formattedPrice: "R$99",
    formattedRegular: "R$399",
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    flag: "🇸🇬",
    name: "Singapore Dollar",
    price: 25,
    regularPrice: 105,
    saveAmount: 80,
    formattedPrice: "S$25",
    formattedRegular: "S$105",
  },
  AED: {
    code: "AED",
    symbol: "AED ",
    flag: "🇦🇪",
    name: "UAE Dirham",
    price: 69,
    regularPrice: 289,
    saveAmount: 220,
    formattedPrice: "AED 69",
    formattedRegular: "AED 289",
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
