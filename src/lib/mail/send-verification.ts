import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail/client";
import { buildVerifyEmailTemplate } from "@/lib/mail/templates/verify-email";
import {
  generateEmailOtp,
  getOtpExpiryDate,
  getResendAvailableAt,
  hashEmailOtp,
} from "@/lib/otp";

export async function issueEmailVerification(params: {
  userId: string;
  email: string;
  fullName?: string | null;
  force?: boolean;
}) {
  const email = params.email.trim().toLowerCase();
  const admin = createAdminClient();

  if (!params.force) {
    const { data: latest } = await admin
      .from("email_otps")
      .select("created_at")
      .eq("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest?.created_at) {
      const availableAt = getResendAvailableAt(new Date(latest.created_at));
      if (availableAt.getTime() > Date.now()) {
        const waitSec = Math.ceil(
          (availableAt.getTime() - Date.now()) / 1000
        );
        return {
          error: `Please wait ${waitSec}s before requesting another code.`,
        } as const;
      }
    }
  }

  const code = generateEmailOtp();
  const codeHash = hashEmailOtp(code, email);
  const expiresAt = getOtpExpiryDate();

  // Invalidate previous unused codes for this email
  await admin
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email)
    .is("consumed_at", null);

  const { error: insertError } = await admin.from("email_otps").insert({
    user_id: params.userId,
    email,
    code_hash: codeHash,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    return { error: insertError.message } as const;
  }

  const template = buildVerifyEmailTemplate({
    fullName: params.fullName,
    code,
  });

  try {
    await sendMail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to send confirmation email.",
    } as const;
  }

  return { success: true as const, expiresAt };
}
