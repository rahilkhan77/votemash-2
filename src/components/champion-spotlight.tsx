import { Trophy } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import type { Product } from "@/db/schema";
import { CATEGORY_LABELS, type ProductCategory } from "@/lib/categories";
import { resolveLogoUrl } from "@/lib/logos";

export function ChampionSpotlight({
  champion,
}: {
  champion: { product: Product; featuredUntil: Date } | null;
}) {
  const product = champion?.product;
  const category = product
    ? (CATEGORY_LABELS[product.category as ProductCategory] ?? product.category)
    : null;

  return (
    <Link
      href="/champion"
      className="glass glass-lift mx-auto block w-full max-w-3xl overflow-hidden rounded-2xl text-left"
    >
      <div className="flex items-center gap-2 border-b border-white/50 px-4 py-2.5 dark:border-white/10">
        <Trophy className="size-4 text-violet-600 dark:text-violet-300" />
        <p className="text-[10px] font-semibold tracking-[0.16em] text-violet-600 uppercase sm:text-[11px] dark:text-violet-300">
          Champion Spotlight
        </p>
      </div>

      <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
        {product ? (
          <BrandLogo
            src={resolveLogoUrl(product.name, product.logoUrl)}
            name={product.name}
            className="size-11 rounded-xl bg-white shadow-sm sm:size-14"
          />
        ) : (
          <div
            className="grid size-11 place-items-center rounded-xl border border-dashed border-violet-400/50 bg-violet-500/10 text-violet-500 shadow-[0_8px_20px_-12px_rgba(124,58,237,0.7)] sm:size-14 dark:border-violet-300/30 dark:bg-violet-400/10 dark:text-violet-200"
            aria-hidden
          >
            <Trophy className="size-5 sm:size-6" />
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight sm:text-xl">
            {product?.name ?? "Awaiting a champion"}
          </p>
          <p className="truncate text-sm text-violet-600 dark:text-violet-300">
            {product
              ? `#1 — ${category} / 48H LEAGUE`
              : "Winner of the next 48-hour league lands here"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {champion
              ? "Featured for 48 hours"
              : "The crown opens when a league ends"}
          </p>
        </div>
      </div>
    </Link>
  );
}
