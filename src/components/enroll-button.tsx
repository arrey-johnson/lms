"use client";

import Link from "next/link";
import { PriceLabel } from "@/components/price-label";

export function EnrollButton({
  courseId,
  priceCents,
  cta = "Buy",
}: {
  courseId: string;
  courseTitle: string;
  priceCents: number;
  cta?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold text-slate-900 dark:text-white">
        <PriceLabel priceCents={priceCents} />
      </p>
      <Link
        href={`/checkout/${courseId}`}
        className="inline-flex h-8 w-full items-center justify-center rounded-md bg-[#0070F8] px-3 text-xs font-semibold text-white transition hover:bg-blue-700"
      >
        {cta}
      </Link>
    </div>
  );
}
