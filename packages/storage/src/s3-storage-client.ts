import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import type { StorageClient, PutParams, PutResult, GetResult } from "./types";

export interface S3StorageConfig {
  bucket: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Optional endpoint override (e.g. for MinIO or LocalStack) */
  endpoint?: string;
  /** Optional key prefix (e.g. "production/") applied to all operations */
  prefix?: string;
}

export function makeS3StorageClient(config: S3StorageConfig): StorageClient {
  const s3 = new S3Client({
    region: config.region ?? "us-east-1",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  });

  const bucket = config.bucket;
  const prefix = config.prefix ?? "";

  function fullKey(key: string): string {
    return `${prefix}${key}`;
  }

  return {
    prefix,

    async put(params: PutParams): Promise<PutResult> {
      const key = fullKey(params.key);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: params.data,
          ContentType: params.contentType,
        }),
      );

      return { key };
    },

    async exists(key: string): Promise<boolean> {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

        return true;
      } catch {
        return false;
      }
    },

    async get(key: string): Promise<GetResult | null> {
      try {
        const response = await s3.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );

        const body = await response.Body?.transformToByteArray();

        if (!body) return null;

        return {
          data: Buffer.from(body),
          contentType: response.ContentType ?? "application/octet-stream",
        };
      } catch {
        return null;
      }
    },
  };
}
