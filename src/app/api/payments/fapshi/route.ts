import { timingSafeEqual } from "crypto";
import { fapshiWebhookSecret } from "@/lib/fapshi/client";
import type { FapshiTransaction } from "@/lib/fapshi/client";
import { syncPaymentById } from "@/lib/payments/sync";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = fapshiWebhookSecret();
  const header = request.headers.get("x-wh-secret") || "";
  if (!secret || !header) return false;
  const left = Buffer.from(header);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as FapshiTransaction | null;
  const transId = body?.transId?.trim();
  const externalId = body?.externalId?.trim();
  if (!transId && !externalId) {
    return Response.json({ message: "Ignored" });
  }

  const admin = createAdminClient();
  const lookup = transId
    ? await admin.from("payments").select("id").eq("trans_id", transId).maybeSingle()
    : await admin
        .from("payments")
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle();

  if (lookup.error || !lookup.data) {
    return Response.json({ message: "Unknown payment" });
  }

  try {
    await syncPaymentById(lookup.data.id, {
      force: true,
      hint: body,
    });
  } catch (error) {
    console.error("Fapshi webhook sync failed", error);
    return Response.json({ message: "Retry" }, { status: 500 });
  }

  return Response.json({ message: "OK" });
}
