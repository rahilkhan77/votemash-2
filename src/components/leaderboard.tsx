import { BrandLogo } from "@/components/brand-logo";
import type { RankedRow } from "@/lib/leagues";
import { CATEGORY_LABELS, type ProductCategory } from "@/lib/categories";
import { resolveLogoUrl } from "@/lib/logos";

export function Leaderboard({
  rows,
  compact = false,
}: {
  rows: RankedRow[];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="glass rounded-2xl px-6 py-12 text-center text-muted-foreground">
        No entries in this category yet.
      </p>
    );
  }

  return (
    <ol className="grid gap-2">
      {rows.map((row) => (
        <li
          key={row.entryId}
          className="glass glass-lift grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5"
        >
          <div className="w-8 text-sm font-semibold tabular-nums text-muted-foreground">
            #{row.rank}
          </div>
          <BrandLogo
            src={resolveLogoUrl(row.product.name, row.product.logoUrl)}
            name={row.product.name}
            className="size-9"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <div className="truncate text-sm font-medium">{row.product.name}</div>
              {row.isFinalist ? (
                <span className="shrink-0 rounded-full bg-violet-600/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
                  Top 3
                </span>
              ) : null}
            </div>
            {!compact ? (
              <div className="truncate text-xs text-muted-foreground">
                {CATEGORY_LABELS[row.product.category as ProductCategory] ??
                  row.product.category}
              </div>
            ) : null}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="text-sm font-semibold text-foreground">{row.rating}</div>
            <div>
              {row.wins}W · {row.losses}L
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
