export type ElyonTransaction = {
  uuid?: string;
  state?: string;
  amount?: number | null;
  externalId?: string | null;
  payer_phone_number?: string | null;
  validation_date?: string | null;
  PSPid?: string | null;
  commission_operateur?: number | null;
  commission_marchand?: number | null;
  commission_pays?: number | null;
  commission_customer?: number | null;
};

type Ok<T> = { ok: true; status: number; data: T };
type Err = { ok: false; status: number; message: string };
export type ElyonResult<T> = Ok<T> | Err;

export function elyonEnvironment(): "sandbox" | "live" {
  return process.env.ELYON_ENV === "sandbox" ? "sandbox" : "live";
}

export function elyonConfigured() {
  return Boolean(process.env.ELYON_API_KEY?.trim() && process.env.ELYON_MERCHANT_ID?.trim());
}

function baseUrl() {
  return elyonEnvironment() === "sandbox"
    ? "https://api.elyonpay.net/api"
    : "https://api.elyonpay.org/api";
}

function merchantId() {
  const id = Number(process.env.ELYON_MERCHANT_ID);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("ElyonPay merchant id is not configured.");
  }
  return id;
}

function cardProviders(): Array<"STRIPE" | "MOLLIE"> {
  const preferred = process.env.ELYON_CARD_PROVIDER?.trim().toUpperCase();
  if (preferred === "MOLLIE") return ["MOLLIE", "STRIPE"];
  return ["STRIPE", "MOLLIE"];
}

async function elyonRequest<T>(
  path: string,
  init?: { method?: "GET" | "POST"; body?: Record<string, unknown> }
): Promise<ElyonResult<T>> {
  const apiKey = process.env.ELYON_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, status: 0, message: "Card payments are not configured yet." };
  }
  const method = init?.method || "GET";
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
      },
      body: method === "GET" ? undefined : JSON.stringify(init?.body ?? {}),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Could not reach ElyonPay. Check the connection and try again.",
    };
  }

  const data = (await response.json().catch(() => null)) as
    | (T & { message?: string; error?: string; success?: boolean })
    | null;
  if (!response.ok || data?.success === false) {
    const message =
      (data && typeof data.message === "string" && data.message) ||
      (data && typeof data.error === "string" && data.error) ||
      `ElyonPay returned status ${response.status}.`;
    return { ok: false, status: response.status, message };
  }
  return { ok: true, status: response.status, data: (data || {}) as T };
}

export type CardCheckout = {
  uuid: string;
  url: string;
  provider: "STRIPE" | "MOLLIE";
};

export async function createCardCheckout(input: {
  amount: number;
  phone: string;
  email?: string | null;
  name?: string | null;
  userId: string;
  externalId: string;
  description: string;
  successUrl: string;
  errorUrl: string;
  webhookUrl?: string;
}): Promise<ElyonResult<CardCheckout>> {
  let last: Err = { ok: false, status: 0, message: "ElyonPay could not start the card payment." };
  for (const provider of cardProviders()) {
    const result = await elyonRequest<{
      success?: boolean;
      url?: string;
      uuid?: string;
      data?: { url?: string; uuid?: string };
    }>("/bankcard/payment/request", {
      method: "POST",
      body: {
        amount: input.amount,
        user_lang: "en",
        merchant_name: "Promptstack Classroom",
        merchant_id: merchantId(),
        currency: "XAF",
        country_name: "Cameroon",
        payment_method: provider,
        msisdn: input.phone,
        customer_msisdn: input.phone,
        external_id: input.externalId,
        product_type: "DIGITAL_ACCESS",
        service_description: input.description.slice(0, 180),
        success: input.successUrl,
        error: input.errorUrl,
        webhook: input.webhookUrl || undefined,
        customer: {
          account_ref: input.userId,
          name: input.name || undefined,
          email: input.email || undefined,
          phone: input.phone,
          locale: "en",
        },
      },
    });
    if (!result.ok) {
      last = result;
      if (result.status === 422) continue;
      return result;
    }
    const payload = result.data.data || result.data;
    if (payload.uuid && payload.url) {
      return {
        ok: true,
        status: result.status,
        data: { uuid: payload.uuid, url: payload.url, provider },
      };
    }
    last = {
      ok: false,
      status: result.status,
      message: "ElyonPay did not return a card payment page.",
    };
  }
  return last;
}

export async function getElyonTransaction(uuid: string) {
  const result = await elyonRequest<ElyonTransaction & { data?: ElyonTransaction }>(
    `/transactions/${encodeURIComponent(uuid)}`
  );
  if (!result.ok) return result;
  const transaction = result.data.data || result.data;
  return { ok: true as const, status: result.status, data: transaction };
}

/** Elyon uses PENDING for money already collected. CREATED is still unpaid. */
export function elyonStateToPaymentStatus(state: string | null | undefined) {
  switch ((state || "").toUpperCase()) {
    case "DELIVERED":
    case "PENDING":
    case "WAITING_FOR_DELIVERY":
    case "ACCEPTED":
    case "SUCCESSFUL":
      return "successful" as const;
    case "FAILED":
    case "DECLINED":
    case "REJECTED":
    case "CANCELLED":
    case "CANCELED":
    case "EXPIRED":
      return "failed" as const;
    default:
      return "pending" as const;
  }
}
