import { NextRequest } from "next/server";

export type ViewerRole = "guest" | "admin";

export function getViewerRole(request: NextRequest): ViewerRole {
  const roleHeader = request.headers.get("x-centerit-role")?.toLowerCase();
  const roleQuery = request.nextUrl.searchParams.get("role")?.toLowerCase();

  if (roleHeader === "admin" || roleQuery === "admin") {
    return "admin";
  }

  return "guest";
}

export function ensureAdmin(request: NextRequest) {
  if (getViewerRole(request) !== "admin") {
    return new Response(JSON.stringify({ error: "Admin permissions required" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return null;
}
