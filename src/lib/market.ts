import { cookies, headers } from "next/headers";
import {
  CURRENCY_COOKIE,
  currencyForRegion,
  regionFromCountry,
  resolveCurrencyChoice,
  resolveMarketFromAcceptLanguage,
  type DisplayCurrency,
  type PriceRegion,
} from "@/lib/currency";
import { getUsdPerEur } from "@/lib/fx";

export type Pricing = {
  currency: DisplayCurrency;
  region: PriceRegion;
  currencyChosen: boolean;
  regionKnown: boolean;
  usdPerEur: number;
};

function countryFromHeaders(headerStore: Headers) {
  return (
    headerStore.get("x-vercel-ip-country") ||
    headerStore.get("cf-ipcountry") ||
    headerStore.get("x-country-code")
  );
}

/** Display currency and checkout region. A saved choice wins over location. */
export async function getPricing(): Promise<Pricing> {
  const [cookieStore, headerStore, usdPerEur] = await Promise.all([
    cookies(),
    headers(),
    getUsdPerEur(),
  ]);

  const choice = resolveCurrencyChoice(cookieStore.get(CURRENCY_COOKIE)?.value);
  const country = countryFromHeaders(headerStore);
  const fromCountry = regionFromCountry(country);
  const languageCurrency = resolveMarketFromAcceptLanguage(headerStore.get("accept-language"));
  const region: PriceRegion = fromCountry || (languageCurrency === "xaf" ? "cm" : "intl");
  const regionKnown = Boolean(fromCountry || languageCurrency === "xaf");

  return {
    currency: choice || currencyForRegion(regionKnown ? region : "intl"),
    region: regionKnown ? region : "intl",
    currencyChosen: Boolean(choice),
    regionKnown,
    usdPerEur,
  };
}

/** @deprecated Prefer getPricing(). */
export async function getPriceMarket(): Promise<DisplayCurrency> {
  const pricing = await getPricing();
  return pricing.currency;
}
