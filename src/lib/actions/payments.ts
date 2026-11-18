"use server";

import { requireStudent } from "@/lib/auth";
import { startCardCheckout } from "@/lib/payments/card";
import { startMobileMoneyCheckout } from "@/lib/payments/start";
import type { StartPaymentResult } from "@/lib/payments/types";

export async function startMobileMoneyPayment(
  courseId: string,
  phone: string
): Promise<StartPaymentResult> {
  const { profile, userId } = await requireStudent();
  return startMobileMoneyCheckout({
    userId,
    courseId,
    phone,
    fullName: profile.full_name,
    email: profile.email,
  });
}

export async function startCardPayment(
  courseId: string,
  phone: string
): Promise<StartPaymentResult> {
  const { profile, userId } = await requireStudent();
  return startCardCheckout({
    userId,
    courseId,
    phone,
    fullName: profile.full_name,
    email: profile.email,
  });
}
