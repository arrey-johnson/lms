"use client";

import { usePricing } from "@/components/pricing-provider";
import { isDisplayCurrency, type DisplayCurrency } from "@/lib/currency";

const OPTIONS: { id: DisplayCurrency; label: string }[] = [
  { id: "usd", label: "USD" },
  { id: "eur", label: "EUR" },
  { id: "xaf", label: "XAF" },
];

export function CurrencySwitcher() {
  const { currency, choose } = usePricing();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Currency</span>
      <select
        aria-label="Currency"
        value={currency}
        onChange={(event) => {
          const next = event.target.value;
          if (isDisplayCurrency(next)) choose(next);
        }}
        className="h-9 appearance-none rounded-lg border border-slate-700 bg-slate-900 py-0 pl-3 pr-8 text-xs font-semibold tracking-wide text-slate-100 outline-none transition focus:border-[#0070F8] focus:ring-2 focus:ring-[#0070F8]/30"
      >
        {OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 text-[10px] text-slate-400"
      >
        ▾
      </span>
    </label>
  );
}
