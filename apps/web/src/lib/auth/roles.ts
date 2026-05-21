import z from "zod";

export const roleSchema = z.enum(["admin", "member"]);

export type Role = z.infer<typeof roleSchema>;
