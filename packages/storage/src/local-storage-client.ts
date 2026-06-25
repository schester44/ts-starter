import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StorageClient, PutParams, PutResult, GetResult } from "./types";

export interface LocalStorageConfig {
  /** Root directory for local file storage */
  directory: string;
  /** Optional key prefix (e.g. "development/") applied to all operations */
  prefix?: string;
}

/**
 * Local filesystem storage client for development.
 *
 * Stores files on disk at `{directory}/{key}` and tracks content types
 * in a sibling `.meta` file.
 */
export function makeLocalStorageClient(
  config: LocalStorageConfig,
): StorageClient {
  const root = config.directory;
  const prefix = config.prefix ?? "";

  function resolvePath(key: string): string {
    return join(root, key);
  }

  function metaPath(filePath: string): string {
    return `${filePath}.meta`;
  }

  return {
    prefix,

    async put(params: PutParams): Promise<PutResult> {
      const key = `${prefix}${params.key}`;
      const filePath = resolvePath(key);

      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, params.data);

      writeFileSync(
        metaPath(filePath),
        JSON.stringify({ contentType: params.contentType }),
      );

      return { key };
    },

    async exists(key: string): Promise<boolean> {
      return existsSync(resolvePath(key));
    },

    async get(key: string): Promise<GetResult | null> {
      const filePath = resolvePath(key);

      if (!existsSync(filePath)) return null;

      const data = readFileSync(filePath);
      let contentType = "application/octet-stream";

      try {
        const meta = JSON.parse(readFileSync(metaPath(filePath), "utf-8")) as {
          contentType?: string;
        };
        if (meta.contentType) contentType = meta.contentType;
      } catch {
        // No meta file — use default
      }

      return { data, contentType };
    },
  };
}
