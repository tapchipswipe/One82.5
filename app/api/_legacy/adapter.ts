import { NextResponse, type NextRequest } from 'next/server';

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (body?: string) => void;
};

type Handler = (req: any, res: any) => unknown | Promise<unknown>;

const headersToRecord = (headers: Headers): Record<string, string> => {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
};

export async function runLegacyApiHandler(request: NextRequest, handler: Handler): Promise<NextResponse> {
  let statusCode = 200;
  const responseHeaders = new Headers();
  let finalized: NextResponse | null = null;

  const res: ResponseLike = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    setHeader: (name: string, value: string | string[]) => {
      const key = name;
      if (Array.isArray(value)) {
        responseHeaders.delete(key);
        for (const entry of value) responseHeaders.append(key, entry);
        return;
      }
      responseHeaders.set(key, value);
    },
    json: (body: unknown) => {
      finalized = NextResponse.json(body, { status: statusCode, headers: responseHeaders });
    },
    end: (body?: string) => {
      finalized = new NextResponse(body ?? null, { status: statusCode, headers: responseHeaders });
    }
  };

  // Build a minimal req-like shape expected by existing handlers.
  const contentType = request.headers.get('content-type') || '';
  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : contentType.includes('application/json')
        ? await request.json().catch(() => undefined)
        : await request.text().catch(() => undefined);

  const req = {
    method: request.method,
    body,
    headers: headersToRecord(request.headers)
  };

  await handler(req, res);

  return finalized ?? new NextResponse(null, { status: statusCode, headers: responseHeaders });
}

