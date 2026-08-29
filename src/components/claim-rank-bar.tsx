"use client";

import {
  Bot,
  Briefcase,
  Check,
  ChevronDown,
  Code2,
  Gamepad2,
  Globe,
  Megaphone,
  Package,
  Palette,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { confirmEntry, previewUrl } from "@/app/actions/enter";
import { BrandLogo } from "@/components/brand-logo";
import {
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from "@/lib/categories";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  "ai-tool": Bot,
  brand: Megaphone,
  "developer-tools": Code2,
  products: Package,
  "design-tool": Palette,
  productivity: Briefcase,
  games: Gamepad2,
} as const;

type Preview = {
  url: string;
  name: string;
  description: string;
  logoUrl: string | null;
  ogImageUrl: string | null;
  amountCents: number;
  suggestedRank: number;
};

function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.includes(".") && !trimmed.includes(" ") && trimmed.length > 3;
}

export function ClaimRankBar() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [openMenu, setOpenMenu] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!openConfirm) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenConfirm(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openConfirm]);

  useEffect(() => {
    if (!looksLikeUrl(url)) {
      setPreview(null);
      return;
    }
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const result = await previewUrl(
          url,
          category || undefined,
        );
        if (!result.ok) {
          setPreview(null);
          return;
        }
        setPreview({
          ...result.metadata,
          amountCents: result.amountCents,
          suggestedRank: result.suggestedRank,
        });
        setError(null);
      });
    }, 500);
    return () => window.clearTimeout(handle);
  }, [url, category]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!category) {
      setError("Choose a category");
      setOpenMenu(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await previewUrl(url, category);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview({
        ...result.metadata,
        amountCents: result.amountCents,
        suggestedRank: result.suggestedRank,
      });
      setAgreed(false);
      setOpenConfirm(true);
    });
  }

  function continueCheckout() {
    if (!preview || !category || !agreed) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmEntry({
        ...preview,
        category,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!result.paid) {
        setOpenConfirm(false);
        router.refresh();
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId: result.intentId }),
      });
      const data = (await response.json()) as {
        checkout_url?: string;
        error?: string;
      };
      if (!response.ok || !data.checkout_url) {
        setError(data.error ?? "Could not start checkout");
        return;
      }
      window.location.href = data.checkout_url;
    });
  }

  const SelectedIcon = category ? CATEGORY_ICONS[category] : null;

  return (
    <div id="enter" className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={submit}
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-center"
      >
        <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1 sm:contents">
        <label className="glass-pill glass-lift flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full px-3 focus-within:border-white sm:col-start-1 sm:h-11 sm:px-4">
          {preview?.logoUrl ? (
            <BrandLogo
              src={preview.logoUrl}
              name={preview.name}
              className="size-6 rounded-md bg-white"
            />
          ) : (
            <Globe className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Product URL"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            required
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="glass-lift h-10 shrink-0 rounded-full border border-white/70 px-3 text-sm font-semibold text-white backdrop-blur-xl disabled:opacity-60 sm:col-start-3 sm:h-11 sm:px-5"
          style={{
            background:
              "linear-gradient(90deg, rgba(232,137,120,0.78), rgba(240,180,150,0.72))",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.45) inset, 0 12px 28px -12px rgba(200,90,60,0.55)",
          }}
        >
          {pending && !openConfirm ? "…" : "Enter"}
        </button>
        </div>

        <div ref={menuRef} className="relative col-span-2 w-full sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setOpenMenu((open) => !open)}
            className="glass-pill glass-lift flex h-10 w-full items-center gap-2 rounded-full px-3 text-left text-sm sm:h-11 sm:px-4"
          >
            {SelectedIcon ? (
              <SelectedIcon className="size-4 shrink-0" />
            ) : null}
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                !category && "text-muted-foreground",
              )}
            >
              {category ? CATEGORY_LABELS[category] : "Choose a category"}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>

          {openMenu ? (
            <div className="absolute top-[calc(100%+8px)] left-0 z-40 max-h-72 w-full overflow-auto rounded-2xl border border-white/50 bg-white py-1 shadow-[0_18px_40px_-16px_rgba(80,40,20,0.45)] sm:left-auto sm:right-0 sm:w-72 dark:border-white/10 dark:bg-zinc-950">
              {PRODUCT_CATEGORIES.map((value) => {
                const Icon = CATEGORY_ICONS[value];
                const active = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setCategory(value);
                      setOpenMenu(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-100",
                      active
                        ? "bg-[#F5F0E8] dark:bg-white/10"
                        : "hover:bg-zinc-100 dark:hover:bg-white/5",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {CATEGORY_LABELS[value]}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

      </form>

      {error && !openConfirm ? (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      ) : null}

      {openConfirm && preview && category ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <div
            role="dialog"
            aria-labelledby="confirm-battle-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-[0_24px_60px_-20px_rgba(20,16,12,0.55)] sm:rounded-3xl dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
              <div>
                <h2
                  id="confirm-battle-title"
                  className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white"
                >
                  Confirm this battle
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Check the rank and price, then agree to the Terms of Service
                  to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenConfirm(false)}
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3 px-4 sm:px-6">
              <BrandLogo
                src={preview.logoUrl}
                name={preview.name}
                className="size-12 rounded-xl bg-zinc-100"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-950 dark:text-white">
                  {preview.name}
                </p>
                <p className="truncate text-xs text-zinc-500">{preview.url}</p>
              </div>
            </div>

            <div className="mx-4 mt-4 flex items-start justify-between rounded-2xl bg-zinc-100 px-4 py-4 sm:mx-6 dark:bg-white/5">
              <div>
                <p className="text-[11px] font-medium tracking-[0.14em] text-zinc-500 uppercase">
                  Rank
                </p>
                <p className="text-3xl font-semibold text-zinc-950 dark:text-white">
                  #{preview.suggestedRank}
                </p>
                <p className="text-xs text-zinc-500">
                  {CATEGORY_LABELS[category]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium tracking-[0.14em] text-zinc-500 uppercase">
                  Price
                </p>
                <p className="text-3xl font-semibold text-zinc-950 dark:text-white">
                  {formatPrice(preview.amountCents)}
                </p>
                <p className="text-xs text-zinc-500">
                  {preview.amountCents === 0 ? "Due never" : "Due now"}
                </p>
              </div>
            </div>

            <p className="px-4 pt-4 text-sm leading-6 text-zinc-500 sm:px-6">
              A listing at that rank on the public board. It goes live when
              payment confirms. Votes can still move the standing after you
              enter.
            </p>

            <label
              className={cn(
                "mx-4 mt-4 flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm sm:mx-6",
                agreed
                  ? "border-[#E67E5F] bg-[#E67E5F]/10"
                  : "border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border",
                  agreed
                    ? "border-[#E67E5F] bg-[#E67E5F] text-white"
                    : "border-zinc-300 bg-white dark:border-white/20 dark:bg-transparent",
                )}
              >
                {agreed ? <Check className="size-3.5" /> : null}
              </span>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="sr-only"
              />
              <span className="text-zinc-700 dark:text-zinc-200">
                I have read and agree to the{" "}
                <Link href="/terms" className="text-[#E67E5F] underline">
                  Terms of Service
                </Link>{" "}
                of VoteMash.
              </span>
            </label>

            <div className="mt-2 px-4 text-xs text-zinc-500 sm:px-6">
              <Link href="/privacy" className="underline">
                Privacy
              </Link>
              <span className="px-1.5">·</span>
              <Link href="/rules" className="underline">
                Rules
              </Link>
            </div>

            {error ? (
              <p className="px-6 pt-3 text-sm text-destructive">{error}</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-4 sm:px-6 dark:border-white/10">
              <button
                type="button"
                onClick={() => setOpenConfirm(false)}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 dark:border-white/15 dark:text-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!agreed || pending}
                onClick={continueCheckout}
                className="rounded-full bg-[#E67E5F] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending
                  ? "Continuing…"
                  : preview.amountCents === 0
                    ? "Enter for free"
                    : "Continue to checkout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
