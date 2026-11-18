import type { Wallet } from "@/lib/payments/types";

/** Cameroon mobile money numbers are 9 digits starting with 6, no country code. */
export function normalizeCameroonPhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00237")) digits = digits.slice(5);
  else if (digits.startsWith("237") && digits.length >= 12) digits = digits.slice(3);
  if (digits.length === 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (!/^6\d{8}$/.test(digits)) return null;
  return digits;
}

export function classifyWallet(phone: string): Wallet | null {
  if (/^69\d{7}$/.test(phone) || /^65[5-9]\d{6}$/.test(phone)) return "orange";
  if (
    /^67\d{7}$/.test(phone) ||
    /^68\d{7}$/.test(phone) ||
    /^65[0-4]\d{6}$/.test(phone)
  ) {
    return "mtn";
  }
  return null;
}

export function walletLabel(wallet: Wallet | null | undefined) {
  if (wallet === "orange") return "Orange Money";
  if (wallet === "mtn") return "MTN Mobile Money";
  return "Mobile Money";
}

export function mediumLabel(
  medium: string | null | undefined,
  phone?: string | null
) {
  const value = (medium || "").toLowerCase();
  if (value === "card" || value.includes("visa") || value.includes("mastercard")) return "Card";
  if (value.includes("orange")) return "Orange Money";
  if (value.includes("mobile")) return "MTN Mobile Money";
  return walletLabel(phone ? classifyWallet(phone) : null);
}

/** Fapshi medium. Omit only when we cannot tell the network. */
export function fapshiMedium(wallet: Wallet) {
  return wallet === "orange" ? "orange money" : "mobile money";
}

export function formatCameroonPhone(phone: string) {
  const normalized = normalizeCameroonPhone(phone) || phone;
  if (normalized.length !== 9) return phone;
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 5)} ${normalized.slice(5, 7)} ${normalized.slice(7)}`;
}

export function maskPhone(phone: string) {
  const normalized = normalizeCameroonPhone(phone) || phone.replace(/\D/g, "");
  if (normalized.length < 5) return phone;
  return `${normalized.slice(0, 3)}****${normalized.slice(-2)}`;
}
