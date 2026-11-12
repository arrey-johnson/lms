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
        <div className="absolute inset-0 scale-150 rounded-full bg-blue-500/15 blur-2xl" />
        <p className="brand-loader-mark relative font-[family-name:var(--font-fraunces)] text-4xl tracking-tight text-slate-900 dark:text-white">
          Learn<span className="text-blue-700 dark:text-blue-400">Space</span>
        </p>
        <div className="relative mt-4 flex items-center gap-1.5">
          <span className="brand-loader-dot h-2 w-2 rounded-full bg-blue-600" />
          <span className="brand-loader-dot brand-loader-dot-2 h-2 w-2 rounded-full bg-blue-600" />
          <span className="brand-loader-dot brand-loader-dot-3 h-2 w-2 rounded-full bg-blue-600" />
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
