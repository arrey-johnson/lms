/** Internal path only, so signup can return to checkout without an open redirect. */
export function safeNextPath(value: unknown) {
  const next = String(value || "").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "";
  if (next.includes("\\") || next.includes("\n") || next.includes("\r")) return "";
  return next.slice(0, 300);
}
