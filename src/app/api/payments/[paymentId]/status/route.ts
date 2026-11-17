import { getCurrentProfile } from "@/lib/auth";
import { publicPaymentView, syncPaymentById } from "@/lib/payments/sync";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;
  const { profile, userId } = await getCurrentProfile();
  if (!userId || !profile) {
    return Response.json({ error: "Sign in required." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("id, user_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !data || (data.user_id !== userId && profile.role !== "admin")) {
    return Response.json({ error: "Payment not found." }, { status: 404 });
  }

  try {
    const result = await syncPaymentById(paymentId);
    if (!result.payment) {
      return Response.json({ error: "Payment not found." }, { status: 404 });
    }
    return Response.json(publicPaymentView(result.payment));
  } catch (syncError) {
    console.error("Payment status check failed", syncError);
    return Response.json(
      { error: "Could not check the payment yet." },
      { status: 502 }
    );
  }
}
