import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "Medien",
    "Infrastruktur",
    "Docker",
    "Smart Home",
    "Entwicklung",
  ];

  for (const [index, name] of categories.entries()) {
    await prisma.category.upsert({
      where: { name },
      update: {
        sortOrder: index,
      },
      create: {
        name,
        sortOrder: index,
      },
    });
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: "CenterIT",
      accentColor: "#22d3ee",
      darkMode: true,
      showServerAddress: true,
      serverAddress: "http://centerit",
    },
  });

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      username: "admin",
      role: UserRole.ADMIN,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
