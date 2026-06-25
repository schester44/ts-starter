import { faker } from "@faker-js/faker";
import { PrismaClient } from "@__APP_NAME__/db";

interface CreateMemberParams {
  organizationId: string;
  userId: string;
  role?: string;
}

export function createMember(db: PrismaClient, options: CreateMemberParams) {
  return db.member.create({
    data: {
      id: faker.string.uuid(),
      organizationId: options.organizationId,
      userId: options.userId,
      role: options.role ?? "member",
      createdAt: new Date(),
    },
  });
}
