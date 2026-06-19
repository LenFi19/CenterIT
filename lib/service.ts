import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getOrCreateDefaultSettings() {
  return prisma.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      title: "CenterIT",
      accentColor: "#22d3ee",
      darkMode: true,
      showServerAddress: true,
      serverAddress: "http://centerit",
    },
    update: {},
  });
}

export async function searchServices({
  search,
  role,
}: {
  search?: string;
  role: "guest" | "admin";
}) {
  const where: Prisma.ServiceWhereInput = {
    ...(role !== "admin" ? { adminOnly: false } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { category: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prisma.service.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: [{ favorite: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}
