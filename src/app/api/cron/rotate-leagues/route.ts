import { NextResponse } from "next/server";
import { rotateExpiredSprints } from "@/lib/leagues";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isVercelCron = request.headers.has("x-vercel-cron");

  if (secret && auth !== `Bearer ${secret}` && !isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await rotateExpiredSprints();
  return NextResponse.json(result);
}
