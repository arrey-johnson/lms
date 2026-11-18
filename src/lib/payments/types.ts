export type PaymentStatus =
  | "created"
  | "pending"
  | "successful"
  | "failed"
  | "expired";

export type FapshiEnvironment = "sandbox" | "live";

export type Wallet = "mtn" | "orange";

export type PaymentRecord = {
  id: string;
  user_id: string;
  course_id: string;
  amount_xaf: number;
  price_cents: number;
  status: PaymentStatus;
  environment: FapshiEnvironment;
  trans_id: string | null;
  external_id: string;
  phone: string | null;
  medium: string | null;
  payer_name: string | null;
  email: string | null;
  checkout_url: string | null;
  financial_trans_id: string | null;
  revenue_xaf: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  last_checked_at: string | null;
  request_notified_at: string | null;
  success_notified_at: string | null;
  failure_notified_at: string | null;
  alerted_at: string | null;
};

export type StartPaymentResult =
  | {
      ok: true;
      paymentId: string;
      courseId: string;
      status: PaymentStatus;
      mode: "prompt" | "link";
      checkoutUrl: string | null;
      amountXaf: number;
      phone: string;
      wallet: Wallet;
      method?: "card" | "momo";
      testMode: boolean;
    }
  | { ok: false; error: string; alreadyEnrolled?: boolean };

export type PublicPayment = {
  id: string;
  courseId: string;
  status: PaymentStatus;
  amountXaf: number;
  phone: string | null;
  walletLabel: string;
  checkoutUrl: string | null;
  financialTransId: string | null;
  message: string | null;
};
