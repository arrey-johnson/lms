import { requireAdmin } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import { formatXaf } from "@/lib/currency";
import { camerpayCallbackSecret, camerpayEnvironment } from "@/lib/camerpay/client";
import { fapshiWebhookSecret } from "@/lib/fapshi/client";
import { formatCameroonPhone, mediumLabel } from "@/lib/fapshi/phone";
import { isMissingPaymentsTable } from "@/lib/payments/sync";
import type { PaymentRecord, PaymentStatus } from "@/lib/payments/types";
import { createAdminClient } from "@/lib/supabase/admin";

const statusTone: Record<PaymentStatus, string> = {
  successful: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  pending: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  created: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  failed: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
  expired: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  const missing = isMissingPaymentsTable(error);
  const payments = missing ? [] : ((data || []) as PaymentRecord[]);
  const userIds = [...new Set(payments.map((payment) => payment.user_id))];
  const courseIds = [...new Set(payments.map((payment) => payment.course_id))];

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    courseIds.length
      ? admin.from("courses").select("id, title").in("id", courseIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const names = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const titles = new Map((courses || []).map((course) => [course.id, course.title]));
  const origin = getAppUrl();
  const webhookUrl = origin ? `${origin}/api/payments/fapshi` : "";
  const cardWebhookUrl = origin ? `${origin}/api/payments/camerpay` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 dark:text-white">
          Payments
        </h1>
        <p className="mt-1 text-slate-500">
          Mobile money and cards are collected through CamerPay. A confirmed payment enrolls the student. Payments that already started on Fapshi can still finish there.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Mobile money" value={camerpayEnvironment() === "live" ? "CamerPay live" : "CamerPay sandbox"} />
        <Info
          label="Fapshi secret"
          value={fapshiWebhookSecret() ? "Configured" : "Missing"}
        />
        <Info label="Fapshi webhook" value={webhookUrl || "Set APP_URL to your public https origin"} />
        <Info label="CamerPay webhook" value={cardWebhookUrl || "Set APP_URL to your public https origin"} />
        <Info label="CamerPay secret" value={camerpayCallbackSecret() ? "Configured" : "Missing"} />
      </div>

      {missing ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The payments table is not in Supabase yet. Run supabase/payments.sql in the SQL editor.
        </p>
      ) : payments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No payments yet. They show up here as soon as a student checks out.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-surface-elevated dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-[color:var(--border)] text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const person = names.get(payment.user_id);
                return (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(payment.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {person?.full_name || "Student"}
                      </p>
                      <p className="text-xs text-slate-400">{person?.email}</p>
                      {payment.phone ? (
                        <p className="text-xs text-slate-400">
                          {formatCameroonPhone(payment.phone)} · {mediumLabel(payment.medium, payment.phone)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {titles.get(payment.course_id) || "Course"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {formatXaf(payment.amount_xaf)}
                      {typeof payment.revenue_xaf === "number" ? (
                        <p className="text-xs font-normal text-slate-400">
                          Net {formatXaf(payment.revenue_xaf)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone[payment.status]}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {payment.trans_id || "—"}
                      {payment.financial_trans_id ? (
                        <p className="mt-1">{payment.financial_trans_id}</p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-surface-elevated px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
