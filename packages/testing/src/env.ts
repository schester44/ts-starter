/**
 * Test fixture for managing environment variables with automatic cleanup.
 *
 * Usage in tests:
 *
 *   test("my test", ({ env }) => {
 *     env.set({ DATABASE_URL: "postgres://localhost/test" });
 *     // process.env.DATABASE_URL is now set
 *   });
 *   // After the test, DATABASE_URL is automatically restored
 *
 * To unset a variable:
 *
 *   env.set({ DATABASE_URL: undefined });
 */

export interface TestEnv {
  /**
   * Set environment variables for the current test.
   * Pass `undefined` to unset a variable.
   * All changes are automatically restored after the test.
   */
  set(overrides: Record<string, string | undefined>): void;
}

export function createTestEnv(): { env: TestEnv; cleanup: () => void } {
  const originals = new Map<string, string | undefined>();

  const env: TestEnv = {
    set(overrides: Record<string, string | undefined>) {
      for (const [key, value] of Object.entries(overrides)) {
        // Only snapshot the original value once per key
        if (!originals.has(key)) {
          originals.set(key, process.env[key]);
        }

        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };

  function cleanup() {
    for (const [key, original] of originals) {
      if (original === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original;
      }
    }

    originals.clear();
  }

  return { env, cleanup };
}
