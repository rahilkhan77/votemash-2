const K = 32;

export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function eloAfterVote(
  winnerRating: number,
  loserRating: number,
): { winnerRating: number; loserRating: number } {
  const winnerExpected = expectedScore(winnerRating, loserRating);
  const loserExpected = expectedScore(loserRating, winnerRating);

  return {
    winnerRating: Math.round(winnerRating + K * (1 - winnerExpected)),
    loserRating: Math.round(loserRating + K * (0 - loserExpected)),
  };
}

export function pairKey(entryIdA: string, entryIdB: string): string {
  return [entryIdA, entryIdB].sort().join(":");
}

export function battlePairKey(
  entryIdA: string,
  entryIdB: string,
  phase: "category" | "finals",
): string {
  const key = pairKey(entryIdA, entryIdB);
  return phase === "finals" ? `f:${key}` : key;
}
