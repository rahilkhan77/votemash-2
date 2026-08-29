"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { leagueEntries, products, votes } from "@/db/schema";
import type { CategoryFilter } from "@/lib/categories";
import { battlePairKey, eloAfterVote } from "@/lib/elo";
import {
  ensureFinalists,
  getBattleForVoter,
  getOpenSprint,
} from "@/lib/leagues";
import { getSprintPhase, shouldLockFinalists } from "@/lib/sprint-phase";
import { requireVoterId } from "@/lib/voter";

export type VoteResult =
  | { ok: true; done: true }
  | {
      ok: true;
      done: false;
      left: { entryId: string };
      right: { entryId: string };
    }
  | { ok: false; error: string };

export async function submitVote(
  winnerEntryId: string,
  loserEntryId: string,
  category: CategoryFilter = "all",
): Promise<VoteResult> {
  if (!winnerEntryId || !loserEntryId || winnerEntryId === loserEntryId) {
    return { ok: false, error: "Invalid battle" };
  }

  const voterId = await requireVoterId();
  const sprint = await getOpenSprint();
  if (!sprint) {
    return { ok: false, error: "No open league right now" };
  }

  if (shouldLockFinalists(sprint)) {
    await ensureFinalists(sprint.id);
  }

  const locked = (await getOpenSprint()) ?? sprint;
  const phase = getSprintPhase(locked);
  if (phase === "ended") {
    return { ok: false, error: "This league has ended" };
  }

  const key = battlePairKey(
    winnerEntryId,
    loserEntryId,
    phase === "finals" ? "finals" : "category",
  );
  const db = getDb();

  try {
    await db.transaction(async (tx) => {
      const pair = await tx
        .select({
          entry: leagueEntries,
          product: products,
        })
        .from(leagueEntries)
        .innerJoin(products, eq(leagueEntries.productId, products.id))
        .where(
          and(
            eq(leagueEntries.leagueId, sprint.id),
            inArray(leagueEntries.id, [winnerEntryId, loserEntryId]),
          ),
        )
        .for("update");

      if (pair.length !== 2) {
        throw new Error("Those entries are not in this league");
      }

      const winner = pair.find((row) => row.entry.id === winnerEntryId);
      const loser = pair.find((row) => row.entry.id === loserEntryId);
      if (!winner || !loser) {
        throw new Error("Those entries are not in this league");
      }

      if (phase === "category") {
        if (winner.product.category !== loser.product.category) {
          throw new Error("Category battles must stay in the same category");
        }
      } else if (!winner.entry.isFinalist || !loser.entry.isFinalist) {
        throw new Error("Finals battles are only for category top 3");
      }

      if (phase === "finals") {
        const next = eloAfterVote(
          winner.entry.finalsRating,
          loser.entry.finalsRating,
        );
        await tx.insert(votes).values({
          voterId,
          leagueId: sprint.id,
          winnerEntryId,
          loserEntryId,
          pairKey: key,
        });
        await tx
          .update(leagueEntries)
          .set({
            finalsRating: next.winnerRating,
            finalsWins: sql`${leagueEntries.finalsWins} + 1`,
          })
          .where(eq(leagueEntries.id, winner.entry.id));
        await tx
          .update(leagueEntries)
          .set({
            finalsRating: next.loserRating,
            finalsLosses: sql`${leagueEntries.finalsLosses} + 1`,
          })
          .where(eq(leagueEntries.id, loser.entry.id));
        return;
      }

      const next = eloAfterVote(winner.entry.rating, loser.entry.rating);

      await tx.insert(votes).values({
        voterId,
        leagueId: sprint.id,
        winnerEntryId,
        loserEntryId,
        pairKey: key,
      });

      await tx
        .update(leagueEntries)
        .set({
          rating: next.winnerRating,
          wins: sql`${leagueEntries.wins} + 1`,
        })
        .where(eq(leagueEntries.id, winner.entry.id));

      await tx
        .update(leagueEntries)
        .set({
          rating: next.loserRating,
          losses: sql`${leagueEntries.losses} + 1`,
        })
        .where(eq(leagueEntries.id, loser.entry.id));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vote failed";
    if (message.includes("votes_voter_league_pair_idx")) {
      return { ok: false, error: "You already voted in this battle" };
    }
    return { ok: false, error: message };
  }

  const nextBattle = await getBattleForVoter(sprint.id, voterId, category);
  if (!nextBattle) {
    return { ok: true, done: true };
  }

  return {
    ok: true,
    done: false,
    left: { entryId: nextBattle[0].entryId },
    right: { entryId: nextBattle[1].entryId },
  };
}
