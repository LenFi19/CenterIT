import { NextRequest, NextResponse } from "next/server";

import { ensureAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultSettings } from "@/lib/service";

export async function GET() {
  const settings = await getOrCreateDefaultSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const adminError = ensureAdmin(request);
  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as {
    title?: string;
    logoUrl?: string | null;
    accentColor?: string;
    darkMode?: boolean;
    showServerAddress?: boolean;
    serverAddress?: string;
  };

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
      ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl?.trim() || null } : {}),
      ...(payload.accentColor !== undefined ? { accentColor: payload.accentColor.trim() } : {}),
      ...(payload.darkMode !== undefined ? { darkMode: payload.darkMode } : {}),
      ...(payload.showServerAddress !== undefined ? { showServerAddress: payload.showServerAddress } : {}),
      ...(payload.serverAddress !== undefined ? { serverAddress: payload.serverAddress.trim() } : {}),
    },
    create: {
      id: 1,
      title: payload.title?.trim() || "CenterIT",
      logoUrl: payload.logoUrl?.trim() || null,
      accentColor: payload.accentColor?.trim() || "#22d3ee",
      darkMode: payload.darkMode ?? true,
      showServerAddress: payload.showServerAddress ?? true,
      serverAddress: payload.serverAddress?.trim() || "http://centerit",
    },
  });

  return NextResponse.json(settings);
}
