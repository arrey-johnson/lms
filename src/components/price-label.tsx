"use client";

import { usePricing } from "@/components/pricing-provider";

/** Course price in the visitor's selected currency. The stored amount is FCFA. */
export function PriceLabel({
  priceCents,
  className,
}: {
  priceCents: number;
  className?: string;
}) {
  const { format } = usePricing();
  return <span className={className}>{format(priceCents)}</span>;
}
