export class RequestBodyError extends Error {
  constructor(public readonly status: 400 | 413, message: string) {
    super(message);
  }
}

export async function readBoundedRequestBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error("maxBytes must be a positive integer");
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    if (!/^\d+$/.test(contentLengthHeader)) throw new RequestBodyError(400, "Invalid Content-Length");
    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength)) throw new RequestBodyError(400, "Invalid Content-Length");
    if (contentLength > maxBytes) throw new RequestBodyError(413, "Request body is too large");
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("request body exceeded limit");
        throw new RequestBodyError(413, "Request body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function decodeUtf8Body(body: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new RequestBodyError(400, "Request body must be valid UTF-8");
  }
}
