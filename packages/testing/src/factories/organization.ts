import { PrismaClient } from "@__APP_NAME__/db";
import { faker } from "@faker-js/faker";

interface CreateOrganizationParams {
  name?: string;
  slug?: string;
}

export function createOrganization(
  db: PrismaClient,
  options?: CreateOrganizationParams,
) {
  const name = options?.name ?? "Test Organization";

  return db.organization.create({
    data: {
      id: faker.string.uuid(),
      name,
      slug: options?.slug ?? faker.helpers.slugify(name).toLowerCase(),
    },
  });
}
