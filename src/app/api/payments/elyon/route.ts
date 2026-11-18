import { syncPaymentById } from "@/lib/payments/sync";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ElyonNotice = {
  data?: {
    transaction?: string;
    external_id?: string;
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ElyonNotice | null;
  const transId = body?.data?.transaction?.trim();
  const externalId = body?.data?.external_id?.trim();
  if (!transId && !externalId) {
    return Response.json({ message: "Ignored" });
  }

  const admin = createAdminClient();
  const lookup = transId
    ? await admin.from("payments").select("id").eq("trans_id", transId).eq("medium", "card").maybeSingle()
    : await admin
        .from("payments")
        .select("id")
        .eq("external_id", externalId)
        .eq("medium", "card")
        .maybeSingle();

  if (lookup.error || !lookup.data) {
    return Response.json({ message: "Unknown payment" });
  }

  try {
    await syncPaymentById(lookup.data.id, { force: true });
  } catch (error) {
    console.error("ElyonPay webhook sync failed", error);
    return Response.json({ message: "Retry" }, { status: 500 });
  }

  return Response.json({ message: "OK" });
}
