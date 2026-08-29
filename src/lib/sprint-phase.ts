import type { League } from "@/db/schema";

export const FINALS_WINDOW_MS = 30 * 60 * 1000;
export const FINALISTS_PER_CATEGORY = 3;

export type SprintPhase = "category" | "finals" | "ended";

export function finalsStartsAt(league: League): Date | null {
  if (!league.endsAt) return null;
  return new Date(league.endsAt.getTime() - FINALS_WINDOW_MS);
}

export function getSprintPhase(
  league: League,
  now: Date = new Date(),
): SprintPhase {
  if (league.endsAt && now.getTime() >= league.endsAt.getTime()) {
    return "ended";
  }
  if (league.finalsLockedAt) return "finals";
  const start = finalsStartsAt(league);
  if (start && now.getTime() >= start.getTime()) return "finals";
  return "category";
}

export function shouldLockFinalists(
  league: League,
  now: Date = new Date(),
): boolean {
  if (league.finalsLockedAt) return false;
  const phase = getSprintPhase(
    { ...league, finalsLockedAt: null },
    now,
  );
  return phase === "finals" || phase === "ended";
}
