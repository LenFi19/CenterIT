import { cookies } from "next/headers";

import { isAdminModeEnabled, isAdminTokenValid, ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { ensureBootstrapData } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

import { DashboardClient, type DashboardService } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureBootstrapData();

  const cookieStore = await cookies();
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  const [settings, services] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.service.findMany({
      include: {
        category: true,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  ]);

  const isAdmin = isAdminTokenValid(adminSessionToken);
  const visibleServices = isAdmin ? services : services.filter((service) => !service.adminOnly);

  return (
    <DashboardClient
      isAdmin={isAdmin}
      adminModeEnabled={isAdminModeEnabled()}
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
