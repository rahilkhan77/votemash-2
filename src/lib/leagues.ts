import { and, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  champions,
  leagueEntries,
  leagues,
  products,
  votes,
  type League,
  type Product,
} from "@/db/schema";
import { PRODUCT_CATEGORIES, type CategoryFilter } from "@/lib/categories";
import { battlePairKey } from "@/lib/elo";
import {
  FINALISTS_PER_CATEGORY,
  getSprintPhase,
  shouldLockFinalists,
  type SprintPhase,
} from "@/lib/sprint-phase";

const SPRINT_MS = 48 * 60 * 60 * 1000;
const PROMOTE_COUNT = 10;

export type BattleSide = {
  entryId: string;
  rating: number;
  wins: number;
  losses: number;
  product: Product;
};

export type RankedRow = {
  rank: number;
  entryId: string;
  rating: number;
  wins: number;
  losses: number;
  isFinalist: boolean;
  product: Product;
};

export async function getOpenSprint(): Promise<League | null> {
  const db = getDb();
  const [league] = await db
    .select()
    .from(leagues)
    .where(and(eq(leagues.kind, "sprint"), eq(leagues.status, "open")))
    .orderBy(desc(leagues.startsAt))
    .limit(1);
  return league ?? null;
}

export async function getGlobalLeague(): Promise<League | null> {
  const db = getDb();
  const [league] = await db
    .select()
    .from(leagues)
    .where(and(eq(leagues.kind, "global"), eq(leagues.status, "open")))
    .limit(1);
  return league ?? null;
}

export async function ensureOpenSprint(): Promise<League> {
  const existing = await getOpenSprint();
  if (existing) return existing;

  const db = getDb();
  const now = new Date();
  const [created] = await db
    .insert(leagues)
    .values({
      kind: "sprint",
      status: "open",
      startsAt: now,
      endsAt: new Date(now.getTime() + SPRINT_MS),
    })
    .returning();
  return created;
}

export async function getLiveSprint(): Promise<{
  league: League;
  phase: SprintPhase;
} | null> {
  await rotateExpiredSprints();
  const league = await getOpenSprint();
  if (!league) return null;
  if (shouldLockFinalists(league)) {
    await ensureFinalists(league.id);
  }
  const fresh = (await getOpenSprint()) ?? league;
  return { league: fresh, phase: getSprintPhase(fresh) };
}

export async function ensureFinalists(leagueId: string): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await lockFinalistsInTx(tx, leagueId);
  });
}

async function lockFinalistsInTx(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  leagueId: string,
): Promise<void> {
  const [league] = await tx
    .select()
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .for("update");
  if (!league || !shouldLockFinalists(league)) return;

  const rows = await tx
    .select({
      entryId: leagueEntries.id,
      rating: leagueEntries.rating,
      wins: leagueEntries.wins,
      category: products.category,
    })
    .from(leagueEntries)
    .innerJoin(products, eq(leagueEntries.productId, products.id))
    .where(eq(leagueEntries.leagueId, leagueId))
    .orderBy(desc(leagueEntries.rating), desc(leagueEntries.wins));

  const picked = new Set<string>();
  for (const category of PRODUCT_CATEGORIES) {
    const top = rows
      .filter((row) => row.category === category)
      .slice(0, FINALISTS_PER_CATEGORY);
    for (const row of top) picked.add(row.entryId);
  }

  if (picked.size > 0) {
    await tx
      .update(leagueEntries)
      .set({
        isFinalist: true,
        finalsRating: 1500,
        finalsWins: 0,
        finalsLosses: 0,
      })
      .where(
        and(
          eq(leagueEntries.leagueId, leagueId),
          inArray(leagueEntries.id, [...picked]),
        ),
      );
  }

  await tx
    .update(leagues)
    .set({ finalsLockedAt: new Date() })
    .where(eq(leagues.id, leagueId));
}

export async function getLeaderboard(
  leagueId: string,
  category: CategoryFilter = "all",
  phase: SprintPhase = "category",
): Promise<RankedRow[]> {
  const db = getDb();
  const finalsBoard = phase === "finals" && category === "all";
  const rows = await db
    .select({
      entryId: leagueEntries.id,
      rating: leagueEntries.rating,
      wins: leagueEntries.wins,
      losses: leagueEntries.losses,
      isFinalist: leagueEntries.isFinalist,
      finalsRating: leagueEntries.finalsRating,
      finalsWins: leagueEntries.finalsWins,
      finalsLosses: leagueEntries.finalsLosses,
      product: products,
    })
    .from(leagueEntries)
    .innerJoin(products, eq(leagueEntries.productId, products.id))
    .where(
      and(
        eq(leagueEntries.leagueId, leagueId),
        category === "all" ? undefined : eq(products.category, category),
        finalsBoard ? eq(leagueEntries.isFinalist, true) : undefined,
      ),
    )
    .orderBy(
      finalsBoard
        ? desc(leagueEntries.finalsRating)
        : desc(leagueEntries.rating),
      finalsBoard ? desc(leagueEntries.finalsWins) : desc(leagueEntries.wins),
      desc(leagueEntries.rating),
    );

  return rows.map((row, index) => ({
    rank: index + 1,
    entryId: row.entryId,
    rating: finalsBoard ? row.finalsRating : row.rating,
    wins: finalsBoard ? row.finalsWins : row.wins,
    losses: finalsBoard ? row.finalsLosses : row.losses,
    isFinalist: row.isFinalist,
    product: row.product,
  }));
}

export async function getBattleForVoter(
  leagueId: string,
  voterId: string,
  category: CategoryFilter = "all",
): Promise<[BattleSide, BattleSide] | null> {
  const db = getDb();
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .limit(1);
  if (!league) return null;

  if (shouldLockFinalists(league)) {
    await ensureFinalists(leagueId);
  }
  const phase = getSprintPhase(
    (await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1))[0] ??
      league,
  );
  if (phase === "ended") return null;

  const entries = await db
    .select({
      entryId: leagueEntries.id,
      rating: leagueEntries.rating,
      wins: leagueEntries.wins,
      losses: leagueEntries.losses,
      isFinalist: leagueEntries.isFinalist,
      product: products,
    })
    .from(leagueEntries)
    .innerJoin(products, eq(leagueEntries.productId, products.id))
    .where(
      and(
        eq(leagueEntries.leagueId, leagueId),
        category === "all" ? undefined : eq(products.category, category),
        phase === "finals" ? eq(leagueEntries.isFinalist, true) : undefined,
      ),
    );

  if (entries.length < 2) return null;

  const voted = await db
    .select({ pairKey: votes.pairKey })
    .from(votes)
    .where(and(eq(votes.voterId, voterId), eq(votes.leagueId, leagueId)));
  const used = new Set(voted.map((row) => row.pairKey));

  const unused: [BattleSide, BattleSide][] = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      if (phase === "category" && entries[i].product.category !== entries[j].product.category) {
        continue;
      }
      const key = battlePairKey(
        entries[i].entryId,
        entries[j].entryId,
        phase === "finals" ? "finals" : "category",
      );
      if (!used.has(key)) {
        unused.push([entries[i], entries[j]]);
      }
    }
  }

  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

export async function getLatestClosedSprint(): Promise<League | null> {
  const db = getDb();
  const [league] = await db
    .select()
    .from(leagues)
    .where(and(eq(leagues.kind, "sprint"), eq(leagues.status, "closed")))
    .orderBy(desc(leagues.endsAt), desc(leagues.createdAt))
    .limit(1);
  return league ?? null;
}

export async function getCurrentChampion(): Promise<{
  product: Product;
  featuredUntil: Date;
  leagueId: string;
} | null> {
  const db = getDb();
  const [row] = await db
    .select({
      product: products,
      featuredUntil: champions.featuredUntil,
      leagueId: champions.leagueId,
    })
    .from(champions)
    .innerJoin(products, eq(champions.productId, products.id))
    .where(gt(champions.featuredUntil, new Date()))
    .orderBy(desc(champions.featuredUntil))
    .limit(1);
  return row ?? null;
}

export async function rotateExpiredSprints(): Promise<{ rotated: boolean }> {
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const expired = await tx
      .select()
      .from(leagues)
      .where(
        and(
          eq(leagues.kind, "sprint"),
          eq(leagues.status, "open"),
          or(isNull(leagues.endsAt), sql`${leagues.endsAt} <= ${now}`),
        ),
      )
      .for("update");

    if (expired.length === 0) {
      return { rotated: false };
    }

    let global = (
      await tx
        .select()
        .from(leagues)
        .where(and(eq(leagues.kind, "global"), eq(leagues.status, "open")))
        .limit(1)
    )[0];

    if (!global) {
      [global] = await tx
        .insert(leagues)
        .values({
          kind: "global",
          status: "open",
          startsAt: now,
          endsAt: null,
        })
        .returning();
    }

    for (const sprint of expired) {
      await lockFinalistsInTx(tx, sprint.id);

      const finalists = await tx
        .select()
        .from(leagueEntries)
        .where(
          and(
            eq(leagueEntries.leagueId, sprint.id),
            eq(leagueEntries.isFinalist, true),
          ),
        )
        .orderBy(
          desc(leagueEntries.finalsRating),
          desc(leagueEntries.finalsWins),
          desc(leagueEntries.rating),
          desc(leagueEntries.wins),
        );

      const promote =
        finalists.length > 0
          ? finalists
          : await tx
              .select()
              .from(leagueEntries)
              .where(eq(leagueEntries.leagueId, sprint.id))
              .orderBy(desc(leagueEntries.rating), desc(leagueEntries.wins))
              .limit(PROMOTE_COUNT);

      for (const entry of promote) {
        await tx
          .insert(leagueEntries)
          .values({
            leagueId: global.id,
            productId: entry.productId,
            rating: entry.rating,
            wins: 0,
            losses: 0,
          })
          .onConflictDoNothing({
            target: [leagueEntries.leagueId, leagueEntries.productId],
          });
      }

      const champion = finalists[0] ?? promote[0];
      if (champion) {
        await tx.insert(champions).values({
          productId: champion.productId,
          leagueId: sprint.id,
          featuredUntil: new Date(now.getTime() + SPRINT_MS),
        });
      }

      await tx
        .update(leagues)
        .set({ status: "closed" })
        .where(eq(leagues.id, sprint.id));
    }

    await tx.insert(leagues).values({
      kind: "sprint",
      status: "open",
      startsAt: now,
      endsAt: new Date(now.getTime() + SPRINT_MS),
    });

    return { rotated: true };
  });
}
