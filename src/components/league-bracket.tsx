"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import type { BracketLogo, FooterBracketData } from "@/lib/bracket";
import { cn } from "@/lib/utils";

function Connector({
  kind,
  flip,
}: {
  kind: "fork4" | "fork2" | "line";
  flip?: boolean;
}) {
  const paths =
    kind === "fork4"
      ? [
          "M1 25 C14 25 14 50 31 50",
          "M1 75 C14 75 14 50 31 50",
          "M1 125 C14 125 14 150 31 150",
          "M1 175 C14 175 14 150 31 150",
        ]
      : kind === "fork2"
        ? ["M1 50 C14 50 14 100 31 100", "M1 150 C14 150 14 100 31 100"]
        : ["M1 100 C12 100 20 100 31 100"];

  return (
    <svg
      viewBox="0 0 32 200"
      className={cn(
        "hidden h-full w-7 shrink-0 text-stone-500/80 dark:text-white/35 sm:block",
        flip && "-scale-x-100",
      )}
      aria-hidden
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function Slot({
  logo,
  hidden,
  size = "md",
}: {
  logo: BracketLogo | null;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "size-14 md:size-16" : size === "sm" ? "size-9" : "size-10 md:size-11";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl",
        dim,
        hidden
          ? "pointer-events-none border border-white/70 bg-white/45 shadow-[0_10px_24px_-8px_rgba(80,40,20,0.45),0_1px_0_rgba(255,255,255,0.75)_inset] dark:border-white/15 dark:bg-white/10 dark:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.7)]"
          : "glass shadow-md",
      )}
      title={hidden ? undefined : (logo?.name ?? undefined)}
      aria-hidden={hidden || !logo}
    >
      {logo && !hidden ? (
        <BrandLogo
          src={logo.logoSrc}
          name={logo.name}
          className="size-[70%] rounded-xl bg-white"
        />
      ) : (
        <span
          className={cn(
            "size-[58%] rounded-xl",
            hidden
              ? "bg-white/80 shadow-[0_6px_16px_-6px_rgba(80,40,20,0.4)] blur-[2px] dark:bg-white/20"
              : "bg-white/50 dark:bg-white/10",
          )}
        />
      )}
    </div>
  );
}

function Column({
  slots,
  hidden,
}: {
  slots: Array<BracketLogo | null>;
  hidden?: boolean;
}) {
  return (
    <div className="flex h-[200px] flex-col justify-around">
      {slots.map((logo, index) => (
        <Slot
          key={logo?.id ?? `empty-${index}`}
          logo={logo}
          hidden={hidden}
        />
      ))}
    </div>
  );
}

export function LeagueBracket({ data }: { data: FooterBracketData }) {
  const live = data.status === "live";
  const winner = data.winner;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-5 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {live ? "48-hour path" : "League complete"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {live
            ? "Later rounds stay blurred until this league ends."
            : "The crown is in — tap the winner."}
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="mx-auto flex min-w-[640px] items-center justify-center gap-1 md:min-w-0 md:gap-2">
          <Column slots={data.tree.leftOuter} />
          <Connector kind="fork4" />
          <Column slots={data.tree.leftInner} hidden={live} />
          <Connector kind="fork2" />
          <div className="flex h-[200px] items-center">
            <Slot logo={data.tree.leftFinal} hidden={live} />
          </div>
          <Connector kind="line" />

          <div className="flex h-[200px] items-center px-1">
            {winner ? (
              <Link
                href="/champion"
                className="champion-reveal glass flex flex-col items-center gap-2 rounded-3xl px-3 py-3"
              >
                <div className="champion-glow flex size-16 items-center justify-center rounded-2xl bg-white md:size-[4.5rem]">
                  <BrandLogo
                    src={winner.logoSrc}
                    name={winner.name}
                    className="size-[72%] rounded-xl bg-white"
                  />
                </div>
                <span className="max-w-24 truncate text-center text-xs font-semibold">
                  {winner.name}
                </span>
              </Link>
            ) : (
              <div
                className="flex size-16 items-center justify-center rounded-2xl border border-white/70 bg-white/45 shadow-[0_14px_32px_-10px_rgba(80,40,20,0.48),0_1px_0_rgba(255,255,255,0.8)_inset] dark:border-white/15 dark:bg-white/10 md:size-[4.5rem]"
                aria-label="Champion slot — locked until the league ends"
              >
                <span className="size-10 rounded-xl bg-white/70 dark:bg-white/10" />
              </div>
            )}
          </div>

          <Connector kind="line" flip />
          <div className="flex h-[200px] items-center">
            <Slot logo={data.tree.rightFinal} hidden={live} />
          </div>
          <Connector kind="fork2" flip />
          <Column slots={data.tree.rightInner} hidden={live} />
          <Connector kind="fork4" flip />
          <Column slots={data.tree.rightOuter} />
        </div>
      </div>
    </div>
  );
}
