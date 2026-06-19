import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { buildCategoryInput } from "@/app/api/services/route";
import { createErrorResponse } from "@/lib/api-response";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateServicePayload } from "@/lib/service-payload";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function parseServiceId(id: string) {
  const serviceId = Number(id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return null;
  }
  return serviceId;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isAdminRequest(request)) {
    return createErrorResponse("UNAUTHORIZED", "Nicht autorisiert.", 403);
  }

  const { id } = await params;
  const serviceId = parseServiceId(id);
  if (!serviceId) {
    return createErrorResponse("INVALID_ID", "Ungültige Service-ID.", 400);
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return createErrorResponse("INVALID_JSON", "Body muss valides JSON sein.", 400);
  }

  const validatedPayload = validateServicePayload(payload);
  if (!validatedPayload.success) {
    return createErrorResponse("INVALID_PAYLOAD", validatedPayload.message, 400, validatedPayload.details);
  }

  try {
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: validatedPayload.data.name,
        description: validatedPayload.data.description,
        url: validatedPayload.data.url,
        icon: validatedPayload.data.icon,
        favorite: validatedPayload.data.favorite,
        adminOnly: validatedPayload.data.adminOnly,
        order: validatedPayload.data.order,
        category:
          validatedPayload.data.categoryId || validatedPayload.data.categoryName
            ? await buildCategoryInput(validatedPayload.data)
            : { disconnect: true },
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return createErrorResponse("NOT_FOUND", "Service nicht gefunden.", 404);
    }
    return createErrorResponse("UPDATE_FAILED", "Service konnte nicht aktualisiert werden.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isAdminRequest(request)) {
    return createErrorResponse("UNAUTHORIZED", "Nicht autorisiert.", 403);
  }

  const { id } = await params;
  const serviceId = parseServiceId(id);
  if (!serviceId) {
    return createErrorResponse("INVALID_ID", "Ungültige Service-ID.", 400);
  }

  try {
    await prisma.service.delete({ where: { id: serviceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return createErrorResponse("NOT_FOUND", "Service nicht gefunden.", 404);
    }
    return createErrorResponse("DELETE_FAILED", "Service konnte nicht gelöscht werden.", 500);
  }
}
