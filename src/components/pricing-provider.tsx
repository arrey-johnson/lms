"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setDisplayCurrency } from "@/lib/actions/currency";
import {
  currencyForRegion,
  detectClientRegion,
  formatCoursePrice,
  type DisplayCurrency,
  type PriceRegion,
} from "@/lib/currency";
import type { Pricing } from "@/lib/market";

type PricingContextValue = Pricing & {
  choose: (currency: DisplayCurrency) => void;
  format: (amountXaf: number) => string;
  cardFirst: boolean;
};

const PricingContext = createContext<PricingContextValue | null>(null);

export function PricingProvider({
  initial,
  children,
}: {
  initial: Pricing;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const signature = `${initial.currency}|${initial.region}|${initial.currencyChosen}|${initial.regionKnown}|${initial.usdPerEur}`;

  useEffect(() => {
    const detected = detectClientRegion();
    const region = initial.regionKnown ? initial.region : detected;
    setState((current) => {
      const currencyChosen = initial.currencyChosen || current.currencyChosen;
      return {
        ...initial,
        region,
        currencyChosen,
        currency: currencyChosen
          ? initial.currencyChosen
            ? initial.currency
            : current.currency
          : currencyForRegion(region),
      };
    });
  }, [signature, initial]);

  function choose(currency: DisplayCurrency) {
    setState((current) => ({ ...current, currency, currencyChosen: true }));
    void setDisplayCurrency(currency).then(() => router.refresh());
  }

  const value: PricingContextValue = {
    ...state,
    choose,
    format: (amountXaf) => formatCoursePrice(amountXaf, state.currency, state.usdPerEur),
    cardFirst: state.region !== "cm",
  };

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing() {
  const value = useContext(PricingContext);
  if (!value) {
    throw new Error("usePricing must be used inside PricingProvider");
  }
  return value;
}

export function useOptionalPricing() {
  return useContext(PricingContext);
}

export type { PriceRegion };
