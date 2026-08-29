import { cookies } from "next/headers";
import { VOTER_COOKIE_NAME, verifyVoterId } from "@/lib/voter-cookie";

export async function getVoterId(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(VOTER_COOKIE_NAME)?.value;
  if (!existing) return null;
  return verifyVoterId(existing);
}

export async function requireVoterId(): Promise<string> {
  const id = await getVoterId();
  if (!id) {
    throw new Error("Missing voter cookie. Refresh the page and try again.");
  }
  return id;
}
