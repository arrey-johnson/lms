import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  variant?: "full" | "icon";
};

const sizeStyles = {
  sm: { height: 28, width: 112 },
  md: { height: 36, width: 144 },
  lg: { height: 44, width: 176 },
  hero: { height: 84, width: 320 },
};

export function BrandLogo({
  href,
  size = "md",
  className,
  variant = "full",
}: BrandLogoProps) {
  const dims = sizeStyles[size];
  const isIcon = variant === "icon";

  const content = (
    <span className={cn("relative inline-flex shrink-0 items-center", className)}>
      <Image
        src={isIcon ? "/brand/icon.png" : "/brand/logo-primary.png"}
        alt="Promptstack Classroom"
        width={isIcon ? dims.height : dims.width}
        height={dims.height}
        className={cn(
          "h-auto w-auto dark:hidden",
          size === "hero" && "max-h-20 w-auto sm:max-h-24",
          isIcon && "h-8 w-8"
        )}
        style={
          isIcon
            ? { height: dims.height, width: dims.height }
            : { height: dims.height, width: "auto" }
        }
        priority={size === "hero" || size === "lg" || size === "sm"}
      />
      <Image
        src={isIcon ? "/brand/icon.png" : "/brand/logo-dark.png"}
        alt="Promptstack Classroom"
        width={isIcon ? dims.height : dims.width}
        height={dims.height}
        className={cn(
          "hidden h-auto w-auto dark:inline-block",
          size === "hero" && "max-h-20 w-auto sm:max-h-24",
          isIcon && "h-8 w-8"
        )}
        style={
          isIcon
            ? { height: dims.height, width: dims.height }
            : { height: dims.height, width: "auto" }
        }
        priority={size === "hero" || size === "lg" || size === "sm"}
      />
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex shrink-0 outline-none">
      {content}
    </Link>
  );
}
