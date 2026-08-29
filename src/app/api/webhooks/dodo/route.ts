import { eq } from "drizzle-orm";
import { Webhooks } from "@dodopayments/nextjs";
import { getDb } from "@/db";
import { entryIntents, webhookEvents } from "@/db/schema";
import { fulfillPaidIntent } from "@/lib/entries";

type PaymentPayload = {
  business_id?: string;
  type?: string;
  timestamp?: string;
  data?: {
    payment_id?: string;
    total_amount?: number;
    metadata?: { intentId?: string };
  };
};

async function rememberEvent(id: string, eventType: string): Promise<boolean> {
  const db = getDb();
  try {
    await db.insert(webhookEvents).values({ id, eventType });
    return true;
  } catch {
    return false;
  }
}

async function handlePaymentSucceeded(payload: PaymentPayload) {
  const paymentId = payload.data?.payment_id;
  const intentId = payload.data?.metadata?.intentId;
  const paidAmount = payload.data?.total_amount;
  if (!paymentId || !intentId) return;

  const db = getDb();
  const [intent] = await db
    .select()
    .from(entryIntents)
    .where(eq(entryIntents.id, intentId))
    .limit(1);

  if (!intent) return;
  if (typeof paidAmount === "number" && paidAmount !== intent.amountCents) {
    throw new Error("Paid amount does not match quoted price");
  }

  await fulfillPaidIntent(intentId, paymentId);
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? "",
  onPayload: async (payload) => {
    const eventId = `${payload.business_id}:${payload.type}:${payload.timestamp}`;
    const first = await rememberEvent(eventId, payload.type);
    if (!first) return;
    if (payload.type === "payment.succeeded") {
      const data = payload.data as {
        payment_id?: string;
        total_amount?: number;
        metadata?: { intentId?: string };
      };
      await handlePaymentSucceeded({
        type: payload.type,
        data,
      });
    }
  },
});
