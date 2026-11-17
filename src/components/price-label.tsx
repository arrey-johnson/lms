"use client";

import { useEffect, useState } from "react";
import {
  detectClientMarket,
  formatCoursePrice,
  type PriceMarket,
} from "@/lib/currency";

/** Course price in FCFA. */
export function PriceLabel({
  priceCents,
  market,
  className,
}: {
  priceCents: number;
  /** Prefer passing from the server when available. */
  market?: PriceMarket;
  className?: string;
}) {
  const [resolved, setResolved] = useState<PriceMarket>(market ?? "usd");

  useEffect(() => {
    if (market) {
      setResolved(market);
      return;
    }
    setResolved(detectClientMarket());
  }, [market]);

  return (
    <span className={className}>{formatCoursePrice(priceCents, resolved)}</span>
  );
}
