import { NextRequest, NextResponse } from "next/server";

import { ensureAdmin, getViewerRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchServices } from "@/lib/service";

type ServicePayload = {
  name: string;
  description?: string;
  url: string;
  icon?: string;
  categoryId: number;
  favorite?: boolean;
  adminOnly?: boolean;
  sortOrder?: number;
};

function validateServicePayload(payload: ServicePayload) {
  if (!payload.name?.trim()) {
    return "Name is required";
  }
  if (!payload.url?.trim()) {
    return "URL is required";
  }
  if (!Number.isInteger(payload.categoryId)) {
    return "Category is required";
  }

  return null;
}

export async function GET(request: NextRequest) {
  const role = getViewerRole(request);
  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  const services = await searchServices({ role, search });

  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  const adminError = ensureAdmin(request);
  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as ServicePayload;
  const validationError = validateServicePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name: payload.name.trim(),
      description: payload.description?.trim() ?? "",
      url: payload.url.trim(),
      icon: payload.icon?.trim() || "Server",
      categoryId: payload.categoryId,
      favorite: Boolean(payload.favorite),
      adminOnly: Boolean(payload.adminOnly),
      sortOrder: payload.sortOrder ?? 0,
    },
    include: {
      category: true,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
