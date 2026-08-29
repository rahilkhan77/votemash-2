import Link from "next/link";
import {
  CATEGORY_FILTERS,
  CATEGORY_LABELS,
  type CategoryFilter,
} from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryTabs({
  selected,
  hrefFor,
}: {
  selected: CategoryFilter;
  hrefFor: (category: CategoryFilter) => string;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
      {CATEGORY_FILTERS.map((category) => (
        <Link
          key={category}
          href={hrefFor(category)}
          className={cn(
            "glass-pill shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
            selected === category
              ? "border-white/80 bg-foreground/85 text-background shadow-md"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {CATEGORY_LABELS[category]}
        </Link>
      ))}
    </div>
  );
}
