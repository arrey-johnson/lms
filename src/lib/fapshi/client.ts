import type { FapshiEnvironment, Wallet } from "@/lib/payments/types";
import { fapshiMedium } from "@/lib/fapshi/phone";

export type FapshiTransaction = {
  transId?: string;
  status?: string;
  medium?: string | null;
  serviceName?: string | null;
  amount?: number | null;
  revenue?: number | null;
  payerName?: string | null;
  email?: string | null;
  externalId?: string | null;
  userId?: string | null;
  financialTransId?: string | null;
  dateInitiated?: string | null;
  dateConfirmed?: string | null;
  message?: string;
  link?: string;
};

type Ok<T> = { ok: true; status: number; data: T };
type Err = { ok: false; status: number; message: string };
export type FapshiResult<T> = Ok<T> | Err;

export function activeFapshiEnvironment(): FapshiEnvironment {
  return process.env.FAPSHI_ENV === "live" ? "live" : "sandbox";
}

export function fapshiWebhookSecret() {
  return (process.env.FAPSHI_WEBHOOK_SECRET || "").trim();
}

export function getFapshiCredentials(environment: FapshiEnvironment) {
  const prefix = environment === "live" ? "FAPSHI_LIVE" : "FAPSHI_SANDBOX";
  const specificUser = process.env[`${prefix}_API_USER`]?.trim();
  const specificKey = process.env[`${prefix}_API_KEY`]?.trim();
  const active = activeFapshiEnvironment();
  const apiUser =
    specificUser ||
    (active === environment ? process.env.FAPSHI_API_USER?.trim() : "");
  const apiKey =
    specificKey ||
    (active === environment ? process.env.FAPSHI_API_KEY?.trim() : "");

  if (!apiUser || !apiKey) {
    throw new Error(
      environment === "live"
        ? "Live Fapshi API key is not configured yet."
        : "Fapshi sandbox API credentials are not configured."
    );
  }

  return {
    environment,
    apiUser,
    apiKey,
    baseUrl:
      environment === "live"
        ? "https://live.fapshi.com"
        : "https://sandbox.fapshi.com",
  };
}

async function fapshiRequest<T>(
  environment: FapshiEnvironment,
  path: string,
  init?: { method?: "GET" | "POST"; body?: Record<string, unknown> }
): Promise<FapshiResult<T>> {
  const { baseUrl, apiUser, apiKey } = getFapshiCredentials(environment);
  const method = init?.method || "GET";
  const headers: Record<string, string> = {
    apiuser: apiUser,
    apikey: apiKey,
  };
  if (method !== "GET") headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: method === "GET" ? undefined : JSON.stringify(init?.body ?? {}),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Could not reach Fapshi. Check the connection and try again.",
    };
  }

  const data = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : `Fapshi returned status ${response.status}.`;
    return { ok: false, status: response.status, message };
  }

  return { ok: true, status: response.status, data: (data || {}) as T };
}

export async function directPay(
  environment: FapshiEnvironment,
  input: {
    amount: number;
    phone: string;
    wallet: Wallet;
    name?: string;
    email?: string;
    userId: string;
    externalId: string;
    message: string;
  }
) {
  return fapshiRequest<FapshiTransaction>(environment, "/direct-pay", {
    method: "POST",
    body: {
      amount: input.amount,
      phone: input.phone,
      medium: fapshiMedium(input.wallet),
      name: input.name || undefined,
      email: input.email || undefined,
      userId: input.userId,
      externalId: input.externalId,
      message: input.message,
    },
  });
}

export async function getPaymentStatus(
  environment: FapshiEnvironment,
  transId: string
) {
  return fapshiRequest<FapshiTransaction>(
    environment,
    `/payment-status/${encodeURIComponent(transId)}`
  );
}

export async function findTransactionByExternalId(
  environment: FapshiEnvironment,
  userId: string,
  externalId: string
) {
  const result = await fapshiRequest<FapshiTransaction[]>(
    environment,
    `/transaction/${encodeURIComponent(userId)}`
  );
  if (!result.ok) return result;
  const rows = Array.isArray(result.data) ? result.data : [];
  const match = rows.find((row) => row.externalId === externalId) || null;
  return { ok: true as const, status: result.status, data: match };
}
