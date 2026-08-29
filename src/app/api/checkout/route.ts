import { eq } from "drizzle-orm";
import DodoPayments from "dodopayments";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { entryIntents } from "@/db/schema";
import { quoteEntryPrice } from "@/lib/entries";

export async function POST(request: Request) {
  const body = (await request.json()) as { intentId?: string };
  if (!body.intentId) {
    return NextResponse.json({ error: "Missing intent" }, { status: 400 });
  }

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const productId = process.env.DODO_PAYMENTS_ENTRY_PRODUCT_ID;
  if (!apiKey || !productId) {
    return NextResponse.json(
      { error: "Dodo Payments is not configured yet" },
      { status: 503 },
    );
  }

  const db = getDb();
  const [intent] = await db
    .select()
    .from(entryIntents)
    .where(eq(entryIntents.id, body.intentId))
    .limit(1);

  if (!intent || intent.status !== "pending") {
    return NextResponse.json({ error: "Intent is not payable" }, { status: 400 });
  }

  const { amountCents } = await quoteEntryPrice();
  if (amountCents !== intent.amountCents) {
    return NextResponse.json(
      { error: "Price changed. Refresh and try again." },
      { status: 409 },
    );
  }

  const client = new DodoPayments({
    bearerToken: apiKey,
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
        ? "live_mode"
        : "test_mode",
  });

  const session = await client.checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        amount: intent.amountCents,
      },
    ],
    return_url:
      process.env.DODO_PAYMENTS_RETURN_URL ??
      "http://localhost:3000/enter/success",
    metadata: {
      intentId: intent.id,
    },
  });

  await db
    .update(entryIntents)
    .set({ dodoSessionId: session.session_id })
    .where(eq(entryIntents.id, intent.id));

  return NextResponse.json({ checkout_url: session.checkout_url });
}
