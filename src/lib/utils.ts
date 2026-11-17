import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatCoursePrice, type PriceMarket } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${Math.round(Math.min(100, Math.max(0, value)))}%`;
}

/** Course price in FCFA. */
export function formatPrice(priceXaf: number, market?: PriceMarket) {
  return formatCoursePrice(priceXaf, market);
}

export type { PriceMarket };

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
