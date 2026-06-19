import { NextRequest, NextResponse } from "next/server";

import { ensureAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ServiceUpdatePayload = {
  name?: string;
  description?: string;
  url?: string;
  icon?: string;
  categoryId?: number;
  favorite?: boolean;
  adminOnly?: boolean;
  sortOrder?: number;
};

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return id;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const adminError = ensureAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const payload = (await request.json()) as ServiceUpdatePayload;

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
      ...(payload.url !== undefined ? { url: payload.url.trim() } : {}),
      ...(payload.icon !== undefined ? { icon: payload.icon.trim() || "Server" } : {}),
      ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId } : {}),
      ...(payload.favorite !== undefined ? { favorite: payload.favorite } : {}),
      ...(payload.adminOnly !== undefined ? { adminOnly: payload.adminOnly } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
    },
    include: {
      category: true,
    },
  });

  return NextResponse.json(service);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const adminError = ensureAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.service.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
