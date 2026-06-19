import { prisma } from "@/lib/prisma";
import { isAdminModeEnabled, isAdminTokenValid } from "@/lib/auth";

import { DashboardClient, type DashboardService } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

const defaultCategories = ["Medien", "Infrastruktur", "Docker", "Smart Home", "Entwicklung"];

async function seedDefaults() {
  const [settings, categoryCount] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.category.count(),
  ]);

  if (!settings) {
    await prisma.settings.create({
      data: {
        id: 1,
        dashboardTitle: "CenterIT",
        accentColor: "#22c55e",
        darkMode: true,
        serverAddress: process.env.NEXT_PUBLIC_SERVER_ADDRESS ?? "http://centerit",
      },
    });
  }

  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: defaultCategories.map((name, index) => ({ name, order: index })),
    });
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await seedDefaults();

  const [{ token }, settings, services] = await Promise.all([
    searchParams,
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.service.findMany({
      include: {
        category: true,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  ]);

  const isAdmin = isAdminTokenValid(token);
  const visibleServices = isAdmin ? services : services.filter((service) => !service.adminOnly);

  return (
    <DashboardClient
      isAdmin={isAdmin}
      adminModeEnabled={isAdminModeEnabled()}
      adminToken={isAdmin ? token ?? null : null}
      services={visibleServices as DashboardService[]}
      settings={{
        dashboardTitle: settings?.dashboardTitle ?? "CenterIT",
        logoUrl: settings?.logoUrl ?? null,
        accentColor: settings?.accentColor ?? "#22c55e",
        darkMode: settings?.darkMode ?? true,
        serverAddress: settings?.serverAddress ?? "http://centerit",
      }}
    />
  );
}
