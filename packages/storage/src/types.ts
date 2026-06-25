export interface StorageClient {
  /** The key prefix applied by put (e.g. "production/") */
  readonly prefix: string;

  /** Upload a file — the prefix is prepended to params.key. Returns the full key. */
  put(params: PutParams): Promise<PutResult>;

  /** Check if a file exists. Key is used as-is (pass the full key from put or DB). */
  exists(key: string): Promise<boolean>;

  /** Get a file's contents. Key is used as-is (pass the full key from put or DB). */
  get(key: string): Promise<GetResult | null>;
}

export interface PutParams {
  /** Storage key (path) for the file */
  key: string;
  /** File contents */
  data: Buffer;
  /** MIME content type */
  contentType: string;
}

export interface PutResult {
  /** The full storage key including any configured prefix — pass this to get/exists */
  key: string;
}

export interface GetResult {
  /** File contents */
  data: Buffer;
  /** MIME content type */
  contentType: string;
}
