import { CategoryTabs } from "@/components/category-tabs";
import { Leaderboard } from "@/components/leaderboard";
import { SetupNotice } from "@/components/setup-notice";
import { parseCategoryFilter } from "@/lib/categories";
import { getGlobalLeague, getLeaderboard } from "@/lib/leagues";
import { setupError } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function GlobalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const missing = setupError();
  if (missing) return <SetupNotice message={missing} />;

  const { category: rawCategory } = await searchParams;
  const category = parseCategoryFilter(rawCategory);
  const league = await getGlobalLeague();
  const rows = league ? await getLeaderboard(league.id, category) : [];

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          All-time
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Global league</h1>
        <p className="text-muted-foreground">
          Qualifiers from each 48-hour league land here.
        </p>
      </div>
      <CategoryTabs
        selected={category}
        hrefFor={(value) =>
          value === "all" ? "/global" : `/global?category=${value}`
        }
      />
      <Leaderboard rows={rows} />
    </div>
  );
}
