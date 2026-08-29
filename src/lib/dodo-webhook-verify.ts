import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET_PREFIX = "whsec_";
const TOLERANCE_SECONDS = 5 * 60;

export class DodoWebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DodoWebhookVerificationError";
  }
}

function decodeWebhookSecret(secret: string): Buffer {
  const raw = secret.startsWith(SECRET_PREFIX)
    ? secret.slice(SECRET_PREFIX.length)
    : secret;
  return Buffer.from(raw, "base64");
}

function sign(secret: Buffer, msgId: string, timestamp: number, payload: string) {
  const digest = createHmac("sha256", secret)
    .update(`${msgId}.${timestamp}.${payload}`)
    .digest("base64");
  return digest;
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyDodoWebhookPayload(
  payload: string,
  headers: {
    "webhook-id"?: string | null;
    "webhook-timestamp"?: string | null;
    "webhook-signature"?: string | null;
  },
  secret: string,
): unknown {
  const msgId = headers["webhook-id"] ?? "";
  const msgTimestamp = headers["webhook-timestamp"] ?? "";
  const msgSignature = headers["webhook-signature"] ?? "";

  if (!msgId || !msgTimestamp || !msgSignature) {
    throw new DodoWebhookVerificationError("Missing required headers");
  }

  const timestamp = Number.parseInt(msgTimestamp, 10);
  if (Number.isNaN(timestamp)) {
    throw new DodoWebhookVerificationError("Invalid Signature Headers");
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > TOLERANCE_SECONDS) {
    throw new DodoWebhookVerificationError("Message timestamp too old");
  }
  if (timestamp > now + TOLERANCE_SECONDS) {
    throw new DodoWebhookVerificationError("Message timestamp too new");
  }

  const expected = sign(decodeWebhookSecret(secret), msgId, timestamp, payload);
  const passed = msgSignature.split(" ");
  for (const versioned of passed) {
    const [version, signature] = versioned.split(",");
    if (version !== "v1" || !signature) continue;
    if (equal(signature, expected)) {
      return JSON.parse(payload) as unknown;
    }
  }

  throw new DodoWebhookVerificationError("No matching signature found");
}
