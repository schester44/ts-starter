import { vi } from "vitest";
import type { StorageClient } from "./types";

export function createMockStorageClient(
  overrides?: Partial<StorageClient>,
): StorageClient {
  return {
    prefix: "test/",
    put: vi.fn().mockImplementation(({ key }) => Promise.resolve({ key })),
    exists: vi.fn().mockResolvedValue(false),
    get: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}
