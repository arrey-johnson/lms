"use server";

import { cookies } from "next/headers";
import { CURRENCY_COOKIE, isDisplayCurrency } from "@/lib/currency";

export async function setDisplayCurrency(currency: string) {
  if (!isDisplayCurrency(currency)) return;
  const store = await cookies();
  store.set(CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
