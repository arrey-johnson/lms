export type DisplayCurrency = "usd" | "eur" | "xaf";
export type PriceRegion = "cm" | "eu" | "intl";

/** @deprecated Use DisplayCurrency. Kept so older imports still type-check. */
export type PriceMarket = DisplayCurrency;

export const MARKET_COOKIE = "pc_market";
export const CURRENCY_COOKIE = "pc_currency";

/** Central African CFA franc is pegged to the euro. */
export const XAF_PER_EUR = 655.957;

const EUROPE = new Set([
  "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE",
  "ES", "FI", "FR", "GB", "GI", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT",
  "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS",
  "SE", "SI", "SK", "SM", "UA", "VA", "XK",
]);

export function isDisplayCurrency(value: string | null | undefined): value is DisplayCurrency {
  return value === "usd" || value === "eur" || value === "xaf";
}

export function regionFromCountry(countryCode: string | null | undefined): PriceRegion | null {
  const country = countryCode?.trim().toUpperCase();
  if (!country) return null;
  if (country === "CM") return "cm";
  if (EUROPE.has(country)) return "eu";
  return "intl";
}

export function currencyForRegion(region: PriceRegion): DisplayCurrency {
  if (region === "cm") return "xaf";
  if (region === "eu") return "eur";
  return "usd";
}

export function resolveMarketFromCountry(countryCode: string | null | undefined): DisplayCurrency {
  return currencyForRegion(regionFromCountry(countryCode) || "intl");
}

export function resolveMarketFromAcceptLanguage(
  acceptLanguage: string | null | undefined
): DisplayCurrency | null {
  if (!acceptLanguage) return null;
  if (/(^|,)\s*(fr|en)-CM\b/i.test(acceptLanguage)) return "xaf";
  return null;
}

export function resolveCurrencyChoice(value: string | null | undefined): DisplayCurrency | null {
  return isDisplayCurrency(value) ? value : null;
}

export function resolveMarketFromCookie(value: string | null | undefined): DisplayCurrency | null {
  if (value === "cm" || value === "xaf") return "xaf";
  if (value === "eur") return "eur";
  if (value === "usd" || value === "intl") return "usd";
  return null;
}

export function marketToCookie(market: DisplayCurrency) {
  return market;
}

/** Client fallback when the server has no country header and the visitor has not chosen. */
export function detectClientRegion(): PriceRegion {
  if (typeof window === "undefined") return "intl";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    // Windows reports Cameroon as Africa/Lagos (W. Central Africa Standard Time).
    if (tz === "Africa/Douala" || tz === "Africa/Lagos") return "cm";
    if (tz.startsWith("Europe/")) return "eu";
  } catch {
    // ignore
  }
  return "intl";
}

export function detectClientMarket(): DisplayCurrency {
  return currencyForRegion(detectClientRegion());
}

/** Whole FCFA stored on the course. Never below Fapshi's 100 XAF minimum. */
export function courseAmountXaf(priceXaf: number) {
  const amount = Math.round(Number(priceXaf));
  if (!Number.isFinite(amount)) return 100;
  return Math.max(100, amount);
}

export function formatXaf(amount: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(amount)))} FCFA`;
}

export function convertFromXaf(amountXaf: number, currency: DisplayCurrency, usdPerEur: number) {
  const xaf = Math.max(0, Number(amountXaf) || 0);
  if (currency === "xaf") return xaf;
  const eur = xaf / XAF_PER_EUR;
  if (currency === "eur") return eur;
  const rate = usdPerEur > 0 ? usdPerEur : 1;
  return eur * rate;
}

export function formatCoursePrice(
  priceXaf: number,
  currency: DisplayCurrency = "xaf",
  usdPerEur = 1
) {
  if (currency === "xaf") return formatXaf(priceXaf);
  const value = convertFromXaf(priceXaf, currency, usdPerEur);
  return new Intl.NumberFormat(currency === "eur" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency === "eur" ? "EUR" : "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
