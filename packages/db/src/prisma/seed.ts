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
        // password: "Password1!" (hashed with scrypt, works with default BETTER_AUTH_SECRET)
        password:
          "42fbe3cb899a6d53ea97f4520a9e126d:5f3d324de5d7cbf123ccc38ed18e3c94a22406411136bae7109b4c9ce8582783093152541e04374aaa085be796615e550108a4034a739bed763d85346b636d1d",
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
