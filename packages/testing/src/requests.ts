type TypedResponse<T> = Response & { __bodyType: T };

export function parseResponseBody<T>(response: TypedResponse<T>) {
  return response.json() as Promise<T>;
}
