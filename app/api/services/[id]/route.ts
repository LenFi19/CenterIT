import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { buildCategoryInput, validateServicePayload } from "@/app/api/services/route";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;
  const serviceId = Number(id);

  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return NextResponse.json({ error: "Ungültige Service-ID" }, { status: 400 });
  }

  const payload = await request.json();
  const validationError = validateServicePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        url: payload.url.trim(),
        icon: payload.icon?.trim() || null,
        favorite: Boolean(payload.favorite),
        adminOnly: Boolean(payload.adminOnly),
        order: payload.order ?? 0,
        category: payload.categoryId || payload.category ? await buildCategoryInput(payload) : { disconnect: true },
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Service nicht gefunden" }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const { id } = await params;
  const serviceId = Number(id);

  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return NextResponse.json({ error: "Ungültige Service-ID" }, { status: 400 });
  }

  try {
    await prisma.service.delete({ where: { id: serviceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Service nicht gefunden" }, { status: 404 });
    }

    throw error;
  }
}
