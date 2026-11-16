import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLoader({
  label = "Loading…",
  fullScreen = false,
  className,
}: {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        fullScreen && "min-h-[60vh] w-full",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 scale-150 rounded-full bg-[#0070F8]/15 blur-2xl" />
        <Image
          src="/brand/icon.png"
          alt="Promptstack Classroom"
          width={64}
          height={64}
          className="brand-loader-mark relative h-14 w-14"
          priority
        />
        <div className="relative mt-4 flex items-center gap-1.5">
          <span className="brand-loader-dot h-2 w-2 rounded-full bg-[#0070F8]" />
          <span className="brand-loader-dot brand-loader-dot-2 h-2 w-2 rounded-full bg-[#0070F8]" />
          <span className="brand-loader-dot brand-loader-dot-3 h-2 w-2 rounded-full bg-[#0070F8]" />
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
