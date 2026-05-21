import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  log: ["info"],
});

const organization = await prisma.organization.upsert({
  where: { id: "c0a80154-7b1d-4f6d-9c8f-5f1d7b9c8f1d" },
  create: {
    id: "c0a80154-7b1d-4f6d-9c8f-5f1d7b9c8f1d",
    name: "Acme Corp",
    slug: "acme-corp",
  },
  update: {},
});

console.log("Seeded organization:", organization.name);

await prisma.user.upsert({
  where: { id: "DtOe3hm7pChWcB9jNDWxETWMPfZTvYXq" },
  update: {},
  create: {
    id: "DtOe3hm7pChWcB9jNDWxETWMPfZTvYXq",
    name: "Test User",
    email: "test@example.com",
    role: "user",
    accounts: {
      create: {
        id: "Ab0t1jlz1t0EgkgL0ZUvQUxt5r6PYFxx",
        accountId: "9nq8KaL07MRGiIDRYURQ3JAlqjFIqX65",
        providerId: "credential",
        // password: "TestPass1!"
        password:
          "b5ac1b4a0de3d950a8d3a4caacb6349b:32b96858f6ba77498d6b6f7ed318e80492455706d764f2fb7e8fbd8267742bf7bf19e2a43f72bd87c99a9356aba19577ca8e939d9c546b596062e7253f649e36",
      },
    },
    members: {
      create: {
        id: "pMNFz1XHPvAV4GbHeUcelL9ufT9jPXug",
        organizationId: organization.id,
        role: "admin",
        createdAt: new Date(),
      },
    },
  },
});

console.log("Seeded user: test@example.com");

await prisma.$disconnect();
console.log("Seed complete!");
