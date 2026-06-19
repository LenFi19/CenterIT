import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

export type UserRole = "guest" | "admin";

function getAdminToken() {
  return process.env.CENTERIT_ADMIN_TOKEN?.trim();
}

export function isAdminModeEnabled() {
  return Boolean(getAdminToken());
}

export function isAdminTokenValid(token: string | null | undefined): boolean {
  const configuredToken = getAdminToken();
  if (!configuredToken || !token) {
    return false;
  }

  const configuredBuffer = Buffer.from(configuredToken);
  const providedBuffer = Buffer.from(token);

  if (configuredBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(configuredBuffer, providedBuffer);
}

export function getRoleFromRequest(request: NextRequest): UserRole {
  const headerToken = request.headers.get("x-centerit-admin-token");
  const queryToken = request.nextUrl.searchParams.get("token");

  if (isAdminTokenValid(headerToken) || isAdminTokenValid(queryToken)) {
    return "admin";
  }

  return "guest";
}

export function isAdminRequest(request: NextRequest): boolean {
  return getRoleFromRequest(request) === "admin";
}
