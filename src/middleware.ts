import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import { SessionResponse } from "@/types/auth";

export async function middleware(request: NextRequest) {
  const response = await betterFetch<SessionResponse>(
    "/api/auth/get-session",
    {
      baseURL: process.env.BETTER_AUTH_URL!,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );


  const { session, user } = response.data?.data || {};

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (user?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|$).*)"],
};
