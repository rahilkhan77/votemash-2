import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { entryIntents, webhookEvents } from "@/db/schema";
import {
  DodoWebhookVerificationError,
  verifyDodoWebhookPayload,
} from "@/lib/dodo-webhook-verify";
import { fulfillPaidIntent } from "@/lib/entries";

export const dynamic = "force-dynamic";

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

function readWebhookSecret(): string | undefined {
  const secret =
    process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET;
  return secret?.trim() || undefined;
}

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

export async function POST(request: NextRequest) {
  const webhookKey = readWebhookSecret();
  if (!webhookKey) {
    return NextResponse.json(
      { error: "Dodo webhooks are not configured yet" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  try {
    const payload = verifyDodoWebhookPayload(
      rawBody,
      {
        "webhook-id": request.headers.get("webhook-id"),
        "webhook-timestamp": request.headers.get("webhook-timestamp"),
        "webhook-signature": request.headers.get("webhook-signature"),
      },
      webhookKey,
    ) as PaymentPayload;

    const eventId = `${payload.business_id}:${payload.type}:${payload.timestamp}`;
    const first = await rememberEvent(eventId, payload.type ?? "unknown");
    if (!first) {
      return new NextResponse(null, { status: 200 });
    }
    if (payload.type === "payment.succeeded") {
      await handlePaymentSucceeded(payload);
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof DodoWebhookVerificationError) {
      return new NextResponse(error.message, { status: 401 });
    }
    throw error;
  }
}
