import { NextRequest, NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/api-response";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkServiceStatus, parseServiceIds, type ServiceHealthStatus } from "@/lib/service-status";

const STATUS_CACHE_TTL_MS = 30_000;
const STATUS_BATCH_SIZE = 8;
const MAX_IDS_PER_REQUEST = 200;

type StatusCacheEntry = {
  status: ServiceHealthStatus;
  checkedAt: number;
};

declare global {
  var centeritStatusCache: Map<number, StatusCacheEntry> | undefined;
}

function getStatusCache() {
  if (!globalThis.centeritStatusCache) {
    globalThis.centeritStatusCache = new Map<number, StatusCacheEntry>();
  }
  return globalThis.centeritStatusCache;
}

export async function GET(request: NextRequest) {
  const isAdmin = isAdminRequest(request);
  const ids = parseServiceIds(request.nextUrl.searchParams.get("ids"));

  if (ids && ids.length > MAX_IDS_PER_REQUEST) {
    return createErrorResponse(
      "TOO_MANY_IDS",
      `Maximal ${MAX_IDS_PER_REQUEST} IDs pro Anfrage erlaubt.`,
      400,
    );
  }

  const services = await prisma.service.findMany({
    where: {
      ...(isAdmin ? {} : { adminOnly: false }),
      ...(ids ? { id: { in: ids } } : {}),
    },
    select: {
      id: true,
      url: true,
    },
  });

  const now = Date.now();
  const cache = getStatusCache();
  const statuses: Record<number, ServiceHealthStatus> = {};
  const toCheck: Array<{ id: number; url: string }> = [];

  for (const service of services) {
    const cached = cache.get(service.id);
    if (cached && now - cached.checkedAt < STATUS_CACHE_TTL_MS) {
      statuses[service.id] = cached.status;
      continue;
    }
    statuses[service.id] = "unknown";
    toCheck.push(service);
  }

  for (let index = 0; index < toCheck.length; index += STATUS_BATCH_SIZE) {
    const batch = toCheck.slice(index, index + STATUS_BATCH_SIZE);
    const batchResult = await Promise.all(
      batch.map(async (service) => {
        const status = await checkServiceStatus(service.url);
        return { id: service.id, status };
      }),
    );

    for (const result of batchResult) {
      statuses[result.id] = result.status;
      cache.set(result.id, {
        status: result.status,
        checkedAt: now,
      });
    }
  }

  return NextResponse.json({ statuses });
}
