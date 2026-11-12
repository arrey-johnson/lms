import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
};

const sizeStyles = {
  sm: {
    title: "text-lg leading-none",
  },
  md: {
    title: "text-xl leading-none",
  },
  lg: {
    title: "text-2xl leading-none",
  },
  hero: {
    title: "text-5xl leading-none sm:text-6xl",
  },
};

export function BrandLogo({
  href,
  size = "md",
  className,
}: BrandLogoProps) {
  const styles = sizeStyles[size];

  const content = (
    <span
      className={cn(
        "font-[family-name:var(--font-fraunces)] tracking-tight text-slate-900 dark:text-white",
        styles.title,
        className
      )}
    >
      Learn<span className="text-blue-700 dark:text-blue-400">Space</span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex shrink-0 outline-none">
      {content}
    </Link>
  );
}
