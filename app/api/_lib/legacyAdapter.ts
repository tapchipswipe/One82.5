import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

type LegacyRequest = {
  method: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | undefined>;
};

type LegacyResponse = {
  status: (code: number) => LegacyResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (body?: string) => void;
};

type LegacyHandler = (req: LegacyRequest, res: LegacyResponse) => Promise<void> | void;

const toQuery = (request: NextRequest): Record<string, string | undefined> => {
  const values: Record<string, string | undefined> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    values[key] = value;
  });
  return values;
};

const toHeaders = (request: NextRequest): Record<string, string | string[] | undefined> => {
  const headers: Record<string, string | string[] | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
};

const withHeaders = (response: NextResponse, headers: Record<string, string | string[]>): NextResponse => {
  Object.entries(headers).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => response.headers.append(name, entry));
      return;
    }
    response.headers.set(name, value);
  });
  return response;
};

const parseAndValidateBody = async (
  request: NextRequest,
  bodySchema?: ZodSchema
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> => {
  if (!bodySchema || !['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
    return { ok: true, body: undefined };
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const parsed = bodySchema.safeParse({});
    if (!parsed.success) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 })
      };
    }
    return { ok: true, body: parsed.data };
  }

  try {
    const jsonBody = await request.json();
    const parsed = bodySchema.safeParse(jsonBody);
    if (!parsed.success) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Invalid request body.',
            issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
          },
          { status: 400 }
        )
      };
    }
    return { ok: true, body: parsed.data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    };
  }
};

export const AnyObjectSchema = z.object({}).passthrough();

export const runLegacyHandler = async (
  request: NextRequest,
  handler: LegacyHandler,
  bodySchema?: ZodSchema
): Promise<NextResponse> => {
  const validation = await parseAndValidateBody(request, bodySchema);
  if ('response' in validation) {
    return validation.response;
  }

  const req: LegacyRequest = {
    method: request.method,
    body: validation.body,
    headers: toHeaders(request),
    query: toQuery(request)
  };

  let statusCode = 200;
  let body: unknown = null;
  const headers: Record<string, string | string[]> = {};

  const res: LegacyResponse = {
    status(code: number): LegacyResponse {
      statusCode = code;
      return this;
    },
    json(payload: unknown): void {
      body = payload;
      headers['content-type'] = 'application/json';
    },
    setHeader(name: string, value: string | string[]): void {
      headers[name.toLowerCase()] = value;
    },
    end(payload?: string): void {
      body = payload ?? null;
    }
  };

  await handler(req, res);

  if (typeof body === 'string') {
    return withHeaders(new NextResponse(body, { status: statusCode }), headers);
  }

  return withHeaders(NextResponse.json(body, { status: statusCode }), headers);
};
