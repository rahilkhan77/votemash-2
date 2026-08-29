import { BrandLogo } from "@/components/brand-logo";
import type { Product } from "@/db/schema";
import { CATEGORY_LABELS, type ProductCategory } from "@/lib/categories";
import { resolveLogoUrl } from "@/lib/logos";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  size = "md",
}: {
  product: Product;
  className?: string;
  size?: "sm" | "md";
}) {
  const compact = size === "sm";

  return (
    <div
      className={cn(
        "glass glass-lift flex h-full flex-col overflow-hidden rounded-2xl text-left",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center bg-white/25 dark:bg-white/5",
          compact ? "aspect-square sm:aspect-[5/4]" : "aspect-[16/10]",
        )}
      >
        <BrandLogo
          src={resolveLogoUrl(product.name, product.logoUrl)}
          name={product.name}
          className={compact ? "size-10 sm:size-16" : "size-16 sm:size-20"}
        />
      </div>
      <div className={cn("flex flex-1 flex-col gap-1", compact ? "p-2 sm:gap-1.5 sm:p-3" : "p-4 sm:p-5")}>
        <p className="truncate text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.16em]">
          {CATEGORY_LABELS[product.category as ProductCategory] ?? product.category}
        </p>
        <h2
          className={cn(
            "truncate font-semibold tracking-tight",
            compact ? "text-sm sm:text-base" : "text-lg sm:text-xl",
          )}
        >
          {product.name}
        </h2>
        <p
          className={cn(
            "text-muted-foreground",
            compact
              ? "line-clamp-2 text-[11px] leading-4 sm:text-xs sm:leading-5"
              : "line-clamp-3 text-sm leading-6",
          )}
        >
          {product.description || product.url}
        </p>
      </div>
    </div>
  );
}
