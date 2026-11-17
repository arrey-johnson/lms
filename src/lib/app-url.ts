/** Public site origin used in payment return links and emails. */
export function getAppUrl() {
  const raw = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

export function checkoutReturnUrl(courseId: string, paymentId: string) {
  const origin = getAppUrl();
  if (!origin.startsWith("https://")) return "";
  return `${origin}/checkout/${courseId}?payment=${paymentId}`;
}
