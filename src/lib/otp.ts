import { createHash, randomInt } from "crypto";

const OTP_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateEmailOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashEmailOtp(code: string, email: string) {
  const pepper = process.env.OTP_PEPPER || process.env.SMTP_PASS || "learnspace";
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${code}:${pepper}`)
    .digest("hex");
}

export function getOtpExpiryDate(from = new Date()) {
  return new Date(from.getTime() + OTP_TTL_MS);
}

export function getResendAvailableAt(from = new Date()) {
  return new Date(from.getTime() + RESEND_COOLDOWN_MS);
}

export { OTP_TTL_MS, RESEND_COOLDOWN_MS };
