import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { entryIntents, leagueEntries, products } from "@/db/schema";
import type { ProductCategory } from "@/lib/categories";
import { ensureOpenSprint } from "@/lib/leagues";
import { priceCentsForConfirmedCount } from "@/lib/pricing";

const ADVISORY_LOCK = 42001;

export type EntryPayload = {
  url: string;
  name: string;
  description: string;
  logoUrl: string | null;
  ogImageUrl: string | null;
  category: ProductCategory;
};

export async function quoteEntryPrice(): Promise<{
  confirmedCount: number;
  amountCents: number;
}> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);
  const confirmedCount = Number(count);
  return {
    confirmedCount,
    amountCents: priceCentsForConfirmedCount(confirmedCount),
  };
}

export async function createConfirmedEntry(payload: EntryPayload) {
  const db = getDb();
  const sprint = await ensureOpenSprint();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${ADVISORY_LOCK})`);

    const existing = await tx
      .select()
      .from(products)
      .where(eq(products.url, payload.url))
      .limit(1);

    let product = existing[0];
    if (!product) {
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(products);
      const amountCents = priceCentsForConfirmedCount(Number(count));
      if (amountCents > 0) {
        throw new Error("This slot is no longer free. Refresh and try again.");
      }

      [product] = await tx
        .insert(products)
        .values({
          url: payload.url,
          name: payload.name,
          description: payload.description,
          logoUrl: payload.logoUrl,
          ogImageUrl: payload.ogImageUrl,
          category: payload.category,
        })
        .returning();
    }

    const [entry] = await tx
      .insert(leagueEntries)
      .values({
        leagueId: sprint.id,
        productId: product.id,
      })
      .onConflictDoNothing({
        target: [leagueEntries.leagueId, leagueEntries.productId],
      })
      .returning();

    return { product, entry: entry ?? null, leagueId: sprint.id };
  });
}

export async function createPaidIntent(payload: EntryPayload) {
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${ADVISORY_LOCK})`);

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(products);
    const amountCents = priceCentsForConfirmedCount(Number(count));
    if (amountCents === 0) {
      throw new Error("This entry is still free. Refresh and submit again.");
    }

    const [intent] = await tx
      .insert(entryIntents)
      .values({
        url: payload.url,
        name: payload.name,
        description: payload.description,
        logoUrl: payload.logoUrl,
        ogImageUrl: payload.ogImageUrl,
        category: payload.category,
        amountCents,
        status: "pending",
      })
      .returning();

    return intent;
  });
}

export async function fulfillPaidIntent(intentId: string, paymentId: string) {
  const db = getDb();
  const sprint = await ensureOpenSprint();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${ADVISORY_LOCK})`);

    const [intent] = await tx
      .select()
      .from(entryIntents)
      .where(eq(entryIntents.id, intentId))
      .for("update");

    if (!intent) throw new Error("Payment intent not found");
    if (intent.status === "fulfilled") return intent;

    const existing = await tx
      .select()
      .from(products)
      .where(eq(products.url, intent.url))
      .limit(1);

    let product = existing[0];
    if (!product) {
      [product] = await tx
        .insert(products)
        .values({
          url: intent.url,
          name: intent.name,
          description: intent.description,
          logoUrl: intent.logoUrl,
          ogImageUrl: intent.ogImageUrl,
          category: intent.category,
        })
        .returning();
    }

    await tx
      .insert(leagueEntries)
      .values({
        leagueId: sprint.id,
        productId: product.id,
      })
      .onConflictDoNothing({
        target: [leagueEntries.leagueId, leagueEntries.productId],
      });

    const [updated] = await tx
      .update(entryIntents)
      .set({
        status: "fulfilled",
        dodoPaymentId: paymentId,
        productId: product.id,
      })
      .where(eq(entryIntents.id, intentId))
      .returning();

    return updated;
  });
}
