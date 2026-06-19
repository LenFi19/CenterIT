import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const isAdmin = isAdminRequest(request);

  const services = await prisma.service.findMany({
    where: isAdmin ? undefined : { adminOnly: false },
    include: {
      category: true,
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(services);
}

type ServicePayload = {
  name: string;
  description?: string;
  url: string;
  icon?: string;
  categoryId?: number;
  category?: string;
  favorite?: boolean;
  adminOnly?: boolean;
  order?: number;
};

function validateServicePayload(payload: Partial<ServicePayload>) {
  if (!payload.name?.trim()) {
    return "Name ist erforderlich.";
  }

  if (!payload.url?.trim()) {
    return "URL ist erforderlich.";
  }

  try {
    new URL(payload.url);
  } catch {
    return "URL ist ungültig.";
  }

  return null;
}

async function buildCategoryInput(payload: ServicePayload) {
  if (typeof payload.categoryId === "number") {
    return { connect: { id: payload.categoryId } };
  }

  if (payload.category?.trim()) {
    return {
      connectOrCreate: {
        where: { name: payload.category.trim() },
        create: { name: payload.category.trim() },
      },
    };
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const payload = (await request.json()) as ServicePayload;
  const validationError = validateServicePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      url: payload.url.trim(),
      icon: payload.icon?.trim() || null,
      favorite: Boolean(payload.favorite),
      adminOnly: Boolean(payload.adminOnly),
      order: payload.order ?? 0,
      category: await buildCategoryInput(payload),
    },
    include: {
      category: true,
    },
  });

  return NextResponse.json(service, { status: 201 });
}

export { buildCategoryInput, validateServicePayload };
