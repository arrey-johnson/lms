import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials, resolveAvatarUrl } from "@/lib/avatars";

export function Avatar({
  avatarUrl,
  name,
  size = "md",
  className,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const src = resolveAvatarUrl(avatarUrl);
  const initials = getInitials(name);
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-20 w-20 text-xl",
    xl: "h-28 w-28 text-2xl",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-800 font-semibold text-white shadow-sm ring-2 ring-white dark:ring-slate-900",
        sizes[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : initials ? (
        <span className="flex h-full w-full items-center justify-center tracking-wide">
          {initials}
        </span>
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          <UserRound className="h-1/2 w-1/2" strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}
