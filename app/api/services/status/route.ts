import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkServiceStatus(url: string): Promise<boolean> {
  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (headResponse.ok) {
      return true;
    }
  } catch {
    // ignored, fallback to GET request below
  }

  try {
    const getResponse = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    return getResponse.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = isAdminRequest(request);

  const ids = request.nextUrl.searchParams
    .get("ids")
    ?.split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const services = await prisma.service.findMany({
    where: {
      ...(isAdmin ? {} : { adminOnly: false }),
      ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
    },
    select: {
      id: true,
      url: true,
    },
  });

  const statusEntries = await Promise.all(
    services.map(async (service) => [service.id, await checkServiceStatus(service.url)] as const),
  );

  return NextResponse.json({ statuses: Object.fromEntries(statusEntries) });
}
