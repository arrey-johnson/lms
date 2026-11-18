"use client";

import { usePricing } from "@/components/pricing-provider";
import type { DisplayCurrency } from "@/lib/currency";

const OPTIONS: { id: DisplayCurrency; label: string }[] = [
  { id: "usd", label: "USD" },
  { id: "eur", label: "EUR" },
  { id: "xaf", label: "XAF" },
];

export function CurrencySwitcher() {
  const { currency, choose } = usePricing();

  return (
    <div
      className="inline-flex rounded-lg border border-[color:var(--border)] bg-surface-elevated/80 p-0.5 dark:border-slate-700 dark:bg-slate-900"
      role="group"
      aria-label="Currency"
    >
      {OPTIONS.map((option) => {
        const active = currency === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => choose(option.id)}
            className={`h-7 rounded-md px-2 text-[11px] font-semibold tracking-wide transition sm:px-2.5 ${
              active
                ? "bg-[#0070F8] text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
