import { NextRequest, NextResponse } from "next/server";

import { createErrorResponse } from "@/lib/api-response";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NormalizedServicePayload, validateServicePayload } from "@/lib/service-payload";

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

async function buildCategoryInput(payload: NormalizedServicePayload) {
  if (typeof payload.categoryId === "number") {
    return { connect: { id: payload.categoryId } };
  }

  if (payload.categoryName) {
    return {
      connectOrCreate: {
        where: { name: payload.categoryName },
        create: { name: payload.categoryName },
      },
    };
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return createErrorResponse("UNAUTHORIZED", "Nicht autorisiert.", 403);
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
    const service = await prisma.service.create({
      data: {
        name: validatedPayload.data.name,
        description: validatedPayload.data.description,
        url: validatedPayload.data.url,
        icon: validatedPayload.data.icon,
        favorite: validatedPayload.data.favorite,
        adminOnly: validatedPayload.data.adminOnly,
        order: validatedPayload.data.order,
        category: await buildCategoryInput(validatedPayload.data),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch {
    return createErrorResponse("CREATE_FAILED", "Service konnte nicht erstellt werden.", 500);
  }
}

export { buildCategoryInput, validateServicePayload };
