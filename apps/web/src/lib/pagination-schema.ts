import z from "zod";

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().catch(20),
  offset: z.coerce.number().min(0).optional().catch(0),
  q: z
    .string()
    .transform((val) => val?.trim())
    .optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export function createPaginatedQuerySchema<T extends z.ZodRawShape>(
  additionalFields: T,
) {
  return paginationSchema.extend(additionalFields);
}

export function createPaginatedResponseSchema<T extends z.ZodObject>(
  entitySchema: T,
) {
  return z.object({
    pagination: z.object({
      limit: z.number(),
      offset: z.number(),
      total: z.number(),
      count: z.number(),
      has_more: z.boolean(),
      next_offset: z.number().nullable(),
    }),
    search: z.string().nullable(),
    items: z.array(entitySchema),
  });
}
