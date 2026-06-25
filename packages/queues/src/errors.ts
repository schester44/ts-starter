/**
 * An error that indicates the job should be retried, but is expected
 * and should not be logged as an error if within retry limits.
 *
 * Use this for cases where a dependency isn't ready yet (e.g., waiting
 * for a record to be created by another process).
 */
export class ExpectedRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpectedRetryableError";
  }
}

export function isExpectedRetryableError(
  error: unknown,
): error is ExpectedRetryableError {
  return error instanceof ExpectedRetryableError;
}
