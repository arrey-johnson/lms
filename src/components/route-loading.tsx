import { BrandLoader } from "@/components/brand-loader";

export function RouteLoading({ label = "Loading page…" }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <BrandLoader fullScreen label={label} />
    </div>
  );
}
