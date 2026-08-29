export function setupError(): string | null {
  if (!process.env.DATABASE_URL) return "DATABASE_URL is not set.";
  if (!process.env.VOTER_COOKIE_SECRET) return "VOTER_COOKIE_SECRET is not set.";
  return null;
}
