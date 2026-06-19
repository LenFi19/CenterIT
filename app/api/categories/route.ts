import { NextRequest, NextResponse } from "next/server";

import { ensureAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const adminError = ensureAdmin(request);
  if (adminError) {
    return adminError;
  }

  const payload = (await request.json()) as {
    name?: string;
    sortOrder?: number;
  };

  if (!payload.name?.trim()) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name.trim(),
      sortOrder: payload.sortOrder ?? 0,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
