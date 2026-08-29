import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const VOTER_COOKIE_NAME = "votemash_vid";
export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function secret(): string {
  const value = process.env.VOTER_COOKIE_SECRET;
  if (!value) {
    throw new Error("VOTER_COOKIE_SECRET is not set");
  }
  return value;
}

export function signVoterId(id: string): string {
  const hmac = createHmac("sha256", secret()).update(id).digest("base64url");
  return `${id}.${hmac}`;
}

export function verifyVoterId(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const given = value.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(id).digest("base64url");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export function issueVoterCookie(): { id: string; value: string } {
  const id = randomUUID();
  return { id, value: signVoterId(id) };
}
