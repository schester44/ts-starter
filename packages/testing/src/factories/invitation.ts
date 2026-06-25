import { faker } from "@faker-js/faker";
import { PrismaClient } from "@__APP_NAME__/db";

interface CreateInvitationParams {
  organizationId: string;
  inviterId: string;
  email?: string;
  role?: string;
  status?: string;
  expiresAt?: Date;
}

export function createInvitation(
  db: PrismaClient,
  options: CreateInvitationParams,
) {
  return db.invitation.create({
    data: {
      id: faker.string.uuid(),
      organizationId: options.organizationId,
      inviterId: options.inviterId,
      email: options.email ?? faker.internet.email(),
      role: options.role ?? "member",
      status: options.status ?? "pending",
      expiresAt:
        options.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}
