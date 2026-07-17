import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
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
        // password: "Password1!" (hashed via @better-auth/utils/password)
        password:
          "6ccd5c782e94dbd521a315b4a77ead48:bf564f041f1bda2199d0a7e13d836b921d003efb34e0e3d2b95ed3dc92920a43bae67d7046e3d30300602f1771611b5e38ecd1a42ad1a843b2c740cbe06b1f84",
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
