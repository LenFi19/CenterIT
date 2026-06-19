import { NextRequest, NextResponse } from "next/server";

import { checkServiceStatus } from "@/lib/status";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { urls?: string[] };
  const urls = payload.urls?.filter(Boolean) ?? [];

  const checks = await Promise.all(
    urls.map(async (url) => ({
      url,
      online: await checkServiceStatus(url),
    })),
  );

  return NextResponse.json(checks);
}
