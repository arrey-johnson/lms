import { cookies, headers } from "next/headers";
import {
  MARKET_COOKIE,
  resolveMarketFromAcceptLanguage,
  resolveMarketFromCookie,
  resolveMarketFromCountry,
  type PriceMarket,
} from "@/lib/currency";

/** Resolve visitor market on the server (Cameroon → FCFA, else USD). */
export async function getPriceMarket(): Promise<PriceMarket> {
  const cookieStore = await cookies();
  const fromCookie = resolveMarketFromCookie(
    cookieStore.get(MARKET_COOKIE)?.value
  );
  if (fromCookie) return fromCookie;

  const headerStore = await headers();
  const country =
    headerStore.get("x-vercel-ip-country") ||
    headerStore.get("cf-ipcountry") ||
    headerStore.get("x-country-code");
  if (country) return resolveMarketFromCountry(country);

  const fromLang = resolveMarketFromAcceptLanguage(
    headerStore.get("accept-language")
  );
  if (fromLang) return fromLang;

  return "usd";
}
