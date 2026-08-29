"use server";

import { parseProductCategory, type ProductCategory } from "@/lib/categories";
import { createConfirmedEntry, createPaidIntent, quoteEntryPrice } from "@/lib/entries";
import { getLeaderboard, getOpenSprint } from "@/lib/leagues";
import { fetchSiteMetadata, type SiteMetadata } from "@/lib/metadata";

export async function previewUrl(
  rawUrl: string,
  category?: ProductCategory,
): Promise<
  | {
      ok: true;
      metadata: SiteMetadata;
      amountCents: number;
      suggestedRank: number;
    }
  | { ok: false; error: string }
> {
  try {
    const metadata = await fetchSiteMetadata(rawUrl);
    const { amountCents } = await quoteEntryPrice();
    const sprint = await getOpenSprint();
    const rows = sprint
      ? await getLeaderboard(sprint.id, category ?? "all")
      : [];
    return {
      ok: true,
      metadata,
      amountCents,
      suggestedRank: rows.length + 1,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not fetch that URL",
    };
  }
}

export async function confirmEntry(input: {
  url: string;
  name: string;
  description: string;
  logoUrl: string | null;
  ogImageUrl: string | null;
  category?: string;
}): Promise<
  | { ok: true; paid: false }
  | { ok: true; paid: true; intentId: string; amountCents: number }
  | { ok: false; error: string }
> {
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name) return { ok: false, error: "Name is required" };

  try {
    const { amountCents } = await quoteEntryPrice();
    const payload = {
      url: input.url,
      name: name.slice(0, 80),
      description: description.slice(0, 280),
      logoUrl: input.logoUrl,
      ogImageUrl: input.ogImageUrl,
      category: parseProductCategory(input.category),
    };

    if (amountCents === 0) {
      await createConfirmedEntry(payload);
      return { ok: true, paid: false };
    }

    const intent = await createPaidIntent(payload);
    return {
      ok: true,
      paid: true,
      intentId: intent.id,
      amountCents: intent.amountCents,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not submit entry",
    };
  }
}
