import { NextResponse, type NextRequest } from "next/server";
import {
  issueVoterCookie,
  verifyVoterId,
  VOTER_COOKIE_MAX_AGE,
  VOTER_COOKIE_NAME,
} from "@/lib/voter-cookie";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(VOTER_COOKIE_NAME)?.value;
  if (existing && verifyVoterId(existing)) {
    return response;
  }

  const issued = issueVoterCookie();
  response.cookies.set({
    name: VOTER_COOKIE_NAME,
    value: issued.value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VOTER_COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
