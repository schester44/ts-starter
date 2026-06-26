import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

// Define your resource permissions here.
// This must remain as const to preserve literal types in consumers.
export const statement = {
  ...defaultStatements,
  developerTools: ["view"],
  // Add your resource permissions below, e.g.:
  // post: ["create", "update", "delete"],
  // settings: ["view", "update"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  ...defaultStatements,
  ...adminAc.statements,
  ...ownerAc.statements,
  developerTools: ["view"],
  // Add admin permissions for your resources here, e.g.:
  // post: ["create", "update", "delete"],
});

export const member = ac.newRole({
  ...defaultStatements,
  // Add member permissions for your resources here, e.g.:
  // post: ["create", "update"],
});
