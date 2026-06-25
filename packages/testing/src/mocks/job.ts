import type PgBoss from "pg-boss";

export function makeJob<T>(
  data: T,
  overrides?: Partial<PgBoss.JobWithMetadata<T>>,
): PgBoss.JobWithMetadata<T> {
  return {
    data,
    retryCount: 0,
    retryLimit: 3,
    ...overrides,
  } as PgBoss.JobWithMetadata<T>;
}
