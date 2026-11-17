export type PriceMarket = "usd" | "xaf";

export const MARKET_COOKIE = "pc_market";

export function resolveMarketFromCountry(countryCode: string | null | undefined): PriceMarket {
  return countryCode?.trim().toUpperCase() === "CM" ? "xaf" : "usd";
}

export function resolveMarketFromAcceptLanguage(
  acceptLanguage: string | null | undefined
): PriceMarket | null {
  if (!acceptLanguage) return null;
  if (/(^|,)\s*(fr|en)-CM\b/i.test(acceptLanguage)) return "xaf";
  return null;
}

export function resolveMarketFromCookie(
  value: string | null | undefined
): PriceMarket | null {
  if (value === "cm" || value === "xaf") return "xaf";
  if (value === "usd" || value === "intl") return "usd";
  return null;
}

export function marketToCookie(market: PriceMarket) {
  return market === "xaf" ? "cm" : "usd";
}

/** Client-side fallback when cookie/geo is missing (timezone / locale). */
export function detectClientMarket(): PriceMarket {
  if (typeof window === "undefined") return "usd";
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${MARKET_COOKIE}=(cm|xaf|usd|intl)`)
    );
    const fromCookie = resolveMarketFromCookie(match?.[1]);
    if (fromCookie) return fromCookie;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Africa/Douala") return "xaf";

    const locale = navigator.language || "";
    if (/-CM$/i.test(locale) || locale.toLowerCase() === "fr-cm") return "xaf";
  } catch {
    // ignore
  }
  return "usd";
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

/** Course prices are whole FCFA for every visitor. */
export function formatCoursePrice(priceXaf: number, _market?: PriceMarket) {
  return formatXaf(priceXaf);
}
