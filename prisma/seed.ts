import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seeded users stand in for real auth (see ARCHITECTURE.md). Anyone
// reviewing the app can log in as any of these via the login screen.
const USERS = [
  { name: "Amara Okafor", email: "amara@ajaia.dev" },
  { name: "Ben Whitfield", email: "ben@ajaia.dev" },
  { name: "Chidi Nwosu", email: "chidi@ajaia.dev" },
];

async function main() {
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }

  const amara = await prisma.user.findUniqueOrThrow({ where: { email: "amara@ajaia.dev" } });
  const ben = await prisma.user.findUniqueOrThrow({ where: { email: "ben@ajaia.dev" } });

  const existing = await prisma.document.findFirst({ where: { ownerId: amara.id } });
  if (!existing) {
    const doc = await prisma.document.create({
      data: {
        title: "Welcome to Ajaia Docs",
        ownerId: amara.id,
        content:
          "<h1>Welcome</h1><p>This is a <strong>sample document</strong> owned by Amara. Try <em>editing</em> it, or open the share panel to see how access works.</p><ul><li>Bold, italic, underline</li><li>Headings</li><li>Lists</li></ul>",
      },
    });
    await prisma.documentShare.create({
      data: { documentId: doc.id, userId: ben.id, permission: "edit" },
    });
  }

  console.log("Seed complete. Users:", USERS.map((u) => u.email).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
