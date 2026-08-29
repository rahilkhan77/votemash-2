import { randomUUID } from "node:crypto";
import Link from "next/link";
import { BattleArena } from "@/components/battle-arena";
import { ChampionSpotlight } from "@/components/champion-spotlight";
import { ClaimRankBar } from "@/components/claim-rank-bar";
import { CategoryTabs } from "@/components/category-tabs";
import { Leaderboard } from "@/components/leaderboard";
import { SetupNotice } from "@/components/setup-notice";
import { SprintCountdown } from "@/components/sprint-countdown";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, parseCategoryFilter } from "@/lib/categories";
import {
  getBattleForVoter,
  getCurrentChampion,
  getLeaderboard,
  getLiveSprint,
} from "@/lib/leagues";
import { setupError } from "@/lib/setup";
import { getVoterId } from "@/lib/voter";

export const dynamic = "force-dynamic";

export default async function HomePage({
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
  const voterId = (await getVoterId()) ?? randomUUID();
  const battle = sprint
    ? await getBattleForVoter(sprint.id, voterId, category)
    : null;
  const rows = sprint ? await getLeaderboard(sprint.id, category, phase) : [];
  const champion = await getCurrentChampion();

  return (
    <div className="grid gap-6 sm:gap-10">
      <div className="grid gap-4">
        <div className="grid gap-4 sm:gap-5">
          <ChampionSpotlight champion={champion} />
          <ClaimRankBar />
          <div className="grid gap-2 text-center">
            <SprintCountdown
              endsAt={sprint?.endsAt?.toISOString() ?? null}
              phase={phase}
            />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-5xl">
              Which one is better?
            </h1>
            <p className="px-1 text-sm text-muted-foreground sm:text-base">
              {phase === "finals"
                ? "Last 30 minutes: category top 3s battle for the crown."
                : "Vote inside a category first. Top 3 from each meet in the last 30 minutes."}
            </p>
          </div>
        </div>
      </div>

      {battle ? (
        <BattleArena left={battle[0]} right={battle[1]} category={category} />
      ) : (
        <div className="glass rounded-2xl px-4 py-10 text-center sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold">
            {sprint ? "No battles left for you" : "The next league is opening"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {sprint
              ? phase === "finals"
                ? "You have voted every finals matchup."
                : `You have already voted every ${CATEGORY_LABELS[category].toLowerCase()} matchup.`
              : "Enter a product or wait for the 48-hour league to start."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href="/#enter">Enter a product</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/rankings">See rankings</Link>
            </Button>
          </div>
        </div>
      )}

      <section className="grid gap-4">
        <CategoryTabs
          selected={category}
          hrefFor={(value) => (value === "all" ? "/" : `/?category=${value}`)}
        />
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">
              {phase === "finals" && category === "all"
                ? "Finals leaderboard"
                : "Leaderboard"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {phase === "finals" && category === "all"
                ? "Only category top 3s. Highest finals Elo becomes champion."
                : `${CATEGORY_LABELS[category]} rankings for this 48-hour league.`}
            </p>
          </div>
          <Link href="/rankings" className="shrink-0 text-xs text-muted-foreground hover:text-foreground sm:text-sm">
            Full rankings
          </Link>
        </div>
        <Leaderboard rows={rows.slice(0, 12)} compact />
      </section>
    </div>
  );
}
