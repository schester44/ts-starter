export type { StorageClient, PutParams, PutResult, GetResult } from "./types";

export { makeS3StorageClient } from "./s3-storage-client";
export type { S3StorageConfig } from "./s3-storage-client";

export { makeLocalStorageClient } from "./local-storage-client";
export type { LocalStorageConfig } from "./local-storage-client";

export { createStorageClient } from "./create-storage-client";
