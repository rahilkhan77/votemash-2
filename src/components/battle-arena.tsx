"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitVote } from "@/app/actions/vote";
import { ProductCard } from "@/components/product-card";
import type { CategoryFilter } from "@/lib/categories";
import type { BattleSide } from "@/lib/leagues";
import { Button } from "@/components/ui/button";

export function BattleArena({
  left,
  right,
  category = "all",
}: {
  left: BattleSide;
  right: BattleSide;
  category?: CategoryFilter;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function vote(winner: BattleSide, loser: BattleSide) {
    setError(null);
    startTransition(async () => {
      const result = await submitVote(winner.entryId, loser.entryId, category);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.done) {
        setDone(true);
        return;
      }
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="glass rounded-2xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">You have voted every matchup</h2>
        <p className="mt-3 text-muted-foreground">
          Rankings are live. Come back when the next 48-hour league starts.
        </p>
        <Button className="mt-6" onClick={() => router.push("/rankings")}>
          See rankings
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-1.5 sm:gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => vote(left, right)}
        className="min-w-0 text-left transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <ProductCard product={left.product} size="sm" />
      </button>
      <div className="flex items-center justify-center px-0.5 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground sm:px-1 sm:text-xs sm:tracking-[0.3em]">
        VS
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => vote(right, left)}
        className="min-w-0 text-left transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <ProductCard product={right.product} size="sm" />
      </button>
      {error ? (
        <p className="col-span-3 text-center text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
