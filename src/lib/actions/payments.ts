"use server";

import { requireStudent } from "@/lib/auth";
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
