import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatCoursePrice, type DisplayCurrency, type PriceMarket } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${Math.round(Math.min(100, Math.max(0, value)))}%`;
}

/** Display price. The stored amount is always FCFA. */
export function formatPrice(
  priceXaf: number,
  currency: DisplayCurrency = "xaf",
  usdPerEur = 1
) {
  return formatCoursePrice(priceXaf, currency, usdPerEur);
}

export type { PriceMarket };

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
