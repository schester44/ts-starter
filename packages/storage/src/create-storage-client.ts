import type { StorageClient } from "./types";
import { makeS3StorageClient } from "./s3-storage-client";
import { makeLocalStorageClient } from "./local-storage-client";

/**
 * Create a storage client based on the STORAGE_ADAPTER environment variable.
 *
 * All keys are automatically prefixed with `{SEMANTIC_ENV}/` so that
 * different environments share the same bucket without collisions:
 *
 *   production/uploads/{orgId}/{fileId}/document.pdf
 *   staging/uploads/{orgId}/{fileId}/document.pdf
 *   development/uploads/{fileId}/document.pdf
 *
 * - `"s3"` — uses S3 (requires AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, AWS_S3_BUCKET)
 * - `"local"` or unset — uses local filesystem (defaults to .uploads)
 */
export function createStorageClient(): StorageClient {
  const adapter = process.env.STORAGE_ADAPTER;
  const semanticEnv = process.env.SEMANTIC_ENV ?? "development";

  if (adapter === "s3") {
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET;

    if (!accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "S3 storage adapter requires AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, and AWS_S3_BUCKET",
      );
    }

    return makeS3StorageClient({
      bucket,
      region: process.env.AWS_REGION ?? "us-east-1",
      accessKeyId,
      secretAccessKey,
      endpoint: process.env.AWS_S3_ENDPOINT,
      prefix: `${semanticEnv}/`,
    });
  }

  const directory = process.env.LOCAL_STORAGE_DIR ?? ".uploads";

  return makeLocalStorageClient({ directory, prefix: `${semanticEnv}/` });
}
