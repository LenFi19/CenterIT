import { prisma } from "@/lib/prisma";

const defaultCategories = ["Medien", "Infrastruktur", "Docker", "Smart Home", "Entwicklung"];

declare global {
  var centeritBootstrapPromise: Promise<void> | undefined;
}

async function initializeDefaults() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      dashboardTitle: "CenterIT",
      accentColor: "#22c55e",
      darkMode: true,
      serverAddress: process.env.NEXT_PUBLIC_SERVER_ADDRESS ?? "http://centerit",
    },
  });

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: defaultCategories.map((name, index) => ({ name, order: index })),
    });
  }
}

export async function ensureBootstrapData() {
  if (!globalThis.centeritBootstrapPromise) {
    globalThis.centeritBootstrapPromise = initializeDefaults().catch((error) => {
      globalThis.centeritBootstrapPromise = undefined;
      throw error;
    });
  }

  await globalThis.centeritBootstrapPromise;
}
