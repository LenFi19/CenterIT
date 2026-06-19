import { NextRequest, NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/api-response";
import { ADMIN_SESSION_COOKIE, isAdminTokenValid } from "@/lib/auth";

const SESSION_TTL_SECONDS = 60 * 60 * 8;

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.token !== "string") {
    return createErrorResponse("INVALID_PAYLOAD", "Ungültige Anfrage.", 400);
  }

  if (!isAdminTokenValid(payload.token)) {
    return createErrorResponse("UNAUTHORIZED", "Admin-Token ist ungültig.", 401);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: payload.token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
