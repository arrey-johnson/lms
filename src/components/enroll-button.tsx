"use client";

import Link from "next/link";
import { PriceLabel } from "@/components/price-label";
import {
  detectClientMarket,
  type PriceMarket,
} from "@/lib/currency";
import { useEffect, useState } from "react";

export function EnrollButton({
  courseId,
  priceCents,
  market,
}: {
  courseId: string;
  courseTitle: string;
  priceCents: number;
  market?: PriceMarket;
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
    <div className="space-y-1.5">
      <p className="text-sm font-bold text-slate-900 dark:text-white">
        <PriceLabel priceCents={priceCents} market={resolved} />
      </p>
      <Link
        href={`/checkout/${courseId}`}
        className="inline-flex h-8 w-full items-center justify-center rounded-md bg-[#0070F8] px-3 text-xs font-semibold text-white transition hover:bg-blue-700"
      >
        Pay with mobile money
      </Link>
    </div>
  );
}
