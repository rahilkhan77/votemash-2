export const PRODUCT_CATEGORIES = [
  "ai-tool",
  "brand",
  "developer-tools",
  "products",
  "design-tool",
  "productivity",
  "games",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type CategoryFilter = "all" | ProductCategory;

export const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: "All",
  "ai-tool": "AI tool",
  brand: "Brand",
  "developer-tools": "Developer tools",
  products: "Products",
  "design-tool": "Design tool",
  productivity: "Productivity",
  games: "Games",
};

export const CATEGORY_FILTERS: CategoryFilter[] = [
  "all",
  ...PRODUCT_CATEGORIES,
];

export function parseCategoryFilter(value?: string): CategoryFilter {
  if (!value || value === "all") return "all";
  return PRODUCT_CATEGORIES.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : "all";
}

export function parseProductCategory(value?: string): ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : "products";
}
