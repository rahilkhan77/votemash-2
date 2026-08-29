"use client";

import { useEffect, useState } from "react";
import type { SprintPhase } from "@/lib/sprint-phase";

function formatRemaining(endsAt: string, phase: SprintPhase): string {
  const remaining = new Date(endsAt).getTime() - Date.now();
  if (remaining <= 0) return "League ending";
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const clock = `${hours}h ${minutes}m left`;
  if (phase === "finals") return `Finals · ${clock}`;
  if (hours === 0 && minutes <= 30) return `Finals · ${clock}`;
  return clock;
}

export function SprintCountdown({
  endsAt,
  phase = "category",
}: {
  endsAt: string | null;
  phase?: SprintPhase;
}) {
  const [label, setLabel] = useState(
    endsAt ? formatRemaining(endsAt, phase) : "Open league",
  );

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setLabel(formatRemaining(endsAt, phase));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [endsAt, phase]);

  return <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>;
}
