import { CategoryTabs } from "@/components/category-tabs";
import { Leaderboard } from "@/components/leaderboard";
import { SetupNotice } from "@/components/setup-notice";
import { SprintCountdown } from "@/components/sprint-countdown";
import { parseCategoryFilter } from "@/lib/categories";
import { getLeaderboard, getLiveSprint } from "@/lib/leagues";
import { setupError } from "@/lib/setup";

export const dynamic = "force-dynamic";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const missing = setupError();
  if (missing) return <SetupNotice message={missing} />;

  const { category: rawCategory } = await searchParams;
  const category = parseCategoryFilter(rawCategory);
  const live = await getLiveSprint();
  const sprint = live?.league ?? null;
  const phase = live?.phase ?? "category";
  const rows = sprint ? await getLeaderboard(sprint.id, category, phase) : [];

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <SprintCountdown
          endsAt={sprint?.endsAt?.toISOString() ?? null}
          phase={phase}
        />
        <h1 className="text-3xl font-semibold tracking-tight">48-hour rankings</h1>
        <p className="text-muted-foreground">
          {phase === "finals"
            ? "Finals Elo is among category top 3s. The #1 at the buzzer is champion."
            : "Category Elo first. Top 3 from every category enter the last-30-minute finals."}
        </p>
      </div>
      <CategoryTabs
        selected={category}
        hrefFor={(value) =>
          value === "all" ? "/rankings" : `/rankings?category=${value}`
        }
      />
      <Leaderboard rows={rows} />
    </div>
  );
}
