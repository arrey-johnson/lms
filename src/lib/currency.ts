export type PriceMarket = "usd" | "xaf";

export const MARKET_COOKIE = "pc_market";

/** Approx. CFA francs per 1 USD — override with USD_TO_XAF_RATE */
export function getUsdToXafRate() {
  const raw = Number(process.env.USD_TO_XAF_RATE || "600");
  return Number.isFinite(raw) && raw > 0 ? raw : 600;
}

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

export function usdCentsToXaf(priceCents: number, rate = getUsdToXafRate()) {
  const dollars = Math.max(0, priceCents) / 100;
  return Math.round(dollars * rate);
}

/** Whole FCFA, never below Fapshi's 100 XAF minimum. */
export function courseAmountXaf(priceCents: number, rate = getUsdToXafRate()) {
  return Math.max(100, usdCentsToXaf(priceCents, rate));
}

export function formatXaf(amount: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(amount)))} FCFA`;
}

/**
 * Format course price for the visitor's market.
 * Canonical storage stays USD cents; Cameroon sees FCFA.
 */
export function formatCoursePrice(
  priceCents: number,
  market: PriceMarket = "usd"
) {
  const cents = Math.max(0, Math.round(priceCents));
  if (market === "xaf") {
    const xaf = usdCentsToXaf(cents);
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(xaf)} FCFA`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
