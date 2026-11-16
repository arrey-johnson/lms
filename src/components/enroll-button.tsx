import { formatPrice } from "@/lib/utils";

const PURCHASE_EMAIL = "hello@promptstacktechnologies.com";

export function EnrollButton({
  courseId,
  courseTitle,
  priceCents,
}: {
  courseId: string;
  courseTitle: string;
  priceCents: number;
}) {
  const price = formatPrice(priceCents);
  const subject = encodeURIComponent(`Purchase: ${courseTitle}`);
  const body = encodeURIComponent(
    `Hi Promptstack,\n\nI'd like to buy "${courseTitle}" (${price}).\n\nCourse ID: ${courseId}\n\nThanks!`
  );
  const href = `mailto:${PURCHASE_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{price}</p>
      <a
        href={href}
        className="inline-flex h-8 w-full items-center justify-center rounded-md bg-[#0070F8] px-3 text-xs font-semibold text-white transition hover:bg-blue-700"
      >
        Buy · {price}
      </a>
    </div>
  );
}
