import { camerPaySignatureMatches } from "@/lib/camerpay/client";
import { syncPaymentById } from "@/lib/payments/sync";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * CamerPay posts application/x-www-form-urlencoded, not JSON.
 * The signature covers uuid|invoice_id|status|amount exactly as received.
 * HTTP 4xx and 5xx are not retried, so a sync failure stays 500 for a manual replay.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ message: "Ignored" });

  const uuid = field(form, "uuid");
  const invoiceId = field(form, "invoice_id");
  const status = field(form, "status");
  const amount = field(form, "amount");
  const signature = field(form, "signature") || request.headers.get("x-camerpay-signature") || "";
  if (!uuid || !invoiceId || !status || !amount) {
    return Response.json({ message: "Ignored" });
  }
  if (!camerPaySignatureMatches({ uuid, invoiceId, status, amount }, signature)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const byTransaction = await admin
    .from("payments")
    .select("id")
    .eq("trans_id", uuid)
    .maybeSingle();
  const lookup = byTransaction.data
    ? byTransaction
    : await admin.from("payments").select("id").eq("external_id", invoiceId).maybeSingle();

  if (lookup.error || !lookup.data) {
    return Response.json({ message: "Unknown payment" });
  }

  try {
    await syncPaymentById(lookup.data.id, { force: true });
  } catch (error) {
    console.error("CamerPay webhook sync failed", error);
    return Response.json({ message: "Retry" }, { status: 500 });
  }

  return Response.json({ message: "OK" });
}
