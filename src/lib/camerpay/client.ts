import { createHmac, timingSafeEqual } from "crypto";

const BASE_URL = "https://camerpay.biz/api";

export const CARD_MIN_XAF = 350;
export const CARD_MAX_XAF = 99_999_999;
export const MOMO_MIN_XAF = 100;
export const MOMO_MAX_XAF = 1_000_000;

export type CamerPayMethod = "stripe" | "orange_money" | "mtn_momo";

type Ok<T> = { ok: true; status: number; data: T };
type Err = { ok: false; status: number; message: string };
export type CamerPayResult<T> = Ok<T> | Err;

export type CamerPayTransaction = {
  uuid: string;
  status: string;
  amount: number | null;
  currency: string | null;
  paymentMethod: string | null;
  invoiceId: string | null;
  isSandbox: boolean | null;
  paidAt: string | null;
  phone: string | null;
};

export function isCamerPayTransactionId(value: string | null | undefined) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "");
}

export function camerpayEnvironment(): "sandbox" | "live" {
  return process.env.CAMERPAY_ENV === "sandbox" ? "sandbox" : "live";
}

export function camerpayCallbackSecret() {
  return process.env.CAMERPAY_CALLBACK_SECRET?.trim() || "";
}

export function camerpayConfigured() {
  return Boolean(process.env.CAMERPAY_TOKEN?.trim() && camerpayCallbackSecret());
}

function token() {
  return process.env.CAMERPAY_TOKEN?.trim() || "";
}

function textMessage(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!Array.isArray(value)) return "";
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .join(" ");
}

function validationMessage(errors: unknown) {
  if (!errors || typeof errors !== "object") return "";
  const lines: string[] = [];
  for (const value of Object.values(errors as Record<string, unknown>)) {
    const line = textMessage(value);
    if (line) lines.push(line);
  }
  return lines.join(" ");
}

function errorMessage(body: Record<string, unknown> | null, status: number) {
  const detailed = validationMessage(body?.errors) || textMessage(body?.message);
  if (detailed) return detailed;
  if (status === 401) return "CamerPay rejected the API token.";
  if (status === 402) return "This amount is above the CamerPay limit on the account.";
  if (status === 403) return "CamerPay has not activated live payments on this account yet.";
  if (status === 429) return "CamerPay is busy. Wait a moment and try again.";
  return `CamerPay returned status ${status}.`;
}

async function camerpayRequest(
  path: string,
  init?: { method?: "GET" | "POST"; body?: Record<string, unknown> }
): Promise<CamerPayResult<Record<string, unknown>>> {
  const apiToken = token();
  if (!apiToken) {
    return { ok: false, status: 0, message: "CamerPay is not configured yet." };
  }
  const method = init?.method || "GET";
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
        ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
      },
      body: method === "GET" ? undefined : JSON.stringify(init?.body ?? {}),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Could not reach CamerPay. Check the connection and try again.",
    };
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || data?.success === false) {
    return { ok: false, status: response.status, message: errorMessage(data, response.status) };
  }
  return { ok: true, status: response.status, data: data || {} };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
  }
  return null;
}

function asSandbox(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return null;
}

export function readCamerPayTransaction(payload: Record<string, unknown>): CamerPayTransaction | null {
  const source = asRecord(payload.transaction) || payload;
  const uuid = asString(source.uuid) || asString(payload.transaction_uuid);
  const status = asString(source.status) || asString(payload.status);
  if (!uuid || !status) return null;
  return {
    uuid,
    status,
    amount: asAmount(source.amount ?? payload.amount),
    currency: asString(source.currency) || asString(payload.currency),
    paymentMethod: asString(source.payment_method) || asString(payload.payment_method),
    invoiceId:
      asString(source.merchant_invoice_id) ||
      asString(source.invoice_id) ||
      asString(payload.merchant_invoice_id) ||
      asString(payload.invoice_id),
    isSandbox: asSandbox(source.is_sandbox ?? payload.is_sandbox),
    paidAt: asString(source.paid_at) || asString(payload.paid_at),
    phone: asString(source.customer_phone) || asString(payload.customer_phone),
  };
}

export type CamerPayCheckout = {
  uuid: string;
  url: string;
  method: CamerPayMethod;
};

function amountLimits(method: CamerPayMethod) {
  if (method === "stripe") return { min: CARD_MIN_XAF, max: CARD_MAX_XAF, label: "Card payments" };
  return { min: MOMO_MIN_XAF, max: MOMO_MAX_XAF, label: "Mobile money payments" };
}

export async function createCamerPayCheckout(input: {
  method: CamerPayMethod;
  amount: number;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  invoiceId: string;
  callbackUrl: string;
  returnUrl: string;
}): Promise<CamerPayResult<CamerPayCheckout>> {
  const limits = amountLimits(input.method);
  if (!Number.isInteger(input.amount) || input.amount < limits.min || input.amount > limits.max) {
    return {
      ok: false,
      status: 422,
      message: `${limits.label} must be between ${limits.min} and ${limits.max} FCFA.`,
    };
  }

  const result = await camerpayRequest("/payment/initiate", {
    method: "POST",
    body: {
      amount: input.amount,
      currency: "XAF",
      payment_method: input.method,
      customer_email: input.email || undefined,
      customer_name: input.name || undefined,
      customer_phone: input.phone || undefined,
      merchant_invoice_id: input.invoiceId,
      merchant_callback_url: input.callbackUrl,
      merchant_return_url: input.returnUrl,
      idempotency_key: input.invoiceId,
      source: "promptstack",
    },
  });
  if (!result.ok) return result;

  const uuid = asString(result.data.transaction_uuid);
  const url = asString(result.data.pay_url) || asString(result.data.redirect_url);
  if (!uuid || !url || !url.startsWith("https://")) {
    return { ok: false, status: result.status, message: "CamerPay did not return a payment page." };
  }
  return { ok: true, status: result.status, data: { uuid, url, method: input.method } };
}

export function createCardCheckout(input: Omit<Parameters<typeof createCamerPayCheckout>[0], "method">) {
  return createCamerPayCheckout({ ...input, method: "stripe" });
}

export async function getCamerPayTransaction(uuid: string) {
  const result = await camerpayRequest(`/payment/${encodeURIComponent(uuid)}/status`);
  if (!result.ok) return result;
  const transaction = readCamerPayTransaction(result.data);
  if (!transaction) {
    return { ok: false as const, status: result.status, message: "CamerPay returned an unreadable payment." };
  }
  return { ok: true as const, status: result.status, data: transaction };
}

/** completed is the only state where CamerPay has collected the money. */
export function camerPayStatusToPaymentStatus(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "successful" as const;
    case "failed":
    case "cancelled":
    case "canceled":
    case "refunded":
      return "failed" as const;
    default:
      return "pending" as const;
  }
}

export function camerPaySignature(input: {
  uuid: string;
  invoiceId: string;
  status: string;
  amount: string;
}) {
  const secret = camerpayCallbackSecret();
  if (!secret) return "";
  return createHmac("sha256", secret)
    .update(`${input.uuid}|${input.invoiceId}|${input.status}|${input.amount}`)
    .digest("hex");
}

export function camerPaySignatureMatches(
  input: { uuid: string; invoiceId: string; status: string; amount: string },
  signature: string
) {
  const expected = camerPaySignature(input);
  const actual = signature.trim().toLowerCase();
  if (!expected || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
