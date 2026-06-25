import { type PrismaClient } from "@__APP_NAME__/db";

export function resetDatabase(db: PrismaClient) {
  const tables = Object.keys(db).filter((key) => {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (db as any)[key]?.deleteMany === "function" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (db as any)[key]?.create === "function"
    );
  });

  return db.$transaction(async (tx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Promise.all(tables.map((table) => (tx as any)[table].deleteMany()));
  });
}
