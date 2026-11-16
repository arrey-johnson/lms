"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueEmailVerification } from "@/lib/mail/send-verification";
import { hashEmailOtp } from "@/lib/otp";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("email not confirmed") ||
      message.includes("email_not_confirmed")
    ) {
      return {
        error: "Please confirm your email with the 6-digit code we sent you.",
        needsVerification: true,
        email,
      };
    }
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, disabled")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.disabled) {
    await supabase.auth.signOut();
    return { error: "Your account has been disabled. Contact support." };
  }

  const role = profile?.role ?? "student";
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect(role === "admin" ? "/admin" : "/dashboard");
}

export async function signupAction(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
        role: "student",
      },
    });

  if (authError || !authData.user) {
    return { error: authError?.message || "Failed to create account." };
  }

  const userId = authData.user.id;

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName || null,
    role: "student",
    disabled: false,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return { error: profileError.message };
  }

  const mailResult = await issueEmailVerification({
    userId,
    email,
    fullName,
    force: true,
  });

  if (mailResult.error) {
    return {
      error: mailResult.error,
      needsVerification: true,
      email,
    };
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function verifyEmailOtpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "")
    .replace(/\s+/g, "")
    .trim();
  const password = String(formData.get("password") || "");

  if (!email || !code) {
    return { error: "Enter the 6-digit code from your email." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: "Confirmation codes are exactly 6 digits." };
  }

  const admin = createAdminClient();
  const codeHash = hashEmailOtp(code, email);

  const { data: otpRow, error: otpError } = await admin
    .from("email_otps")
    .select("id, user_id, expires_at, consumed_at")
    .eq("email", email)
    .eq("code_hash", codeHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError) return { error: otpError.message };
  if (!otpRow || otpRow.consumed_at) {
    return { error: "Invalid or expired confirmation code." };
  }
  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return { error: "That code has expired. Request a new one." };
  }

  const { error: confirmError } = await admin.auth.admin.updateUserById(
    otpRow.user_id,
    { email_confirm: true }
  );
  if (confirmError) return { error: confirmError.message };

  await admin
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", otpRow.id);

  // Prefer signing the user in when password is provided (from signup handoff)
  if (password) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      redirect(profile?.role === "admin" ? "/admin" : "/dashboard");
    }
  }

  redirect(`/login?verified=1&email=${encodeURIComponent(email)}`);
}

export async function resendEmailOtpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return { error: "No account found for that email." };
  }

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(profile.id);
  if (userError || !userData.user) {
    return { error: userError?.message || "Account not found." };
  }
  if (userData.user.email_confirmed_at) {
    return { error: "This email is already confirmed. You can sign in." };
  }

  const result = await issueEmailVerification({
    userId: profile.id,
    email,
    fullName: profile.full_name,
  });

  if (result.error) return { error: result.error };
  return { success: true, message: "A new code has been sent to your email." };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
