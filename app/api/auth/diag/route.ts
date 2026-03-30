import { NextResponse, type NextRequest } from 'next/server';

const mask = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= 8) return '*'.repeat(trimmed.length);
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
};

export async function GET(_request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const configured = {
    SUPABASE_URL: Boolean(supabaseUrl),
    SUPABASE_ANON_KEY: Boolean(anonKey),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceRole)
  };

  const payload: Record<string, unknown> = {
    ok: true,
    configured,
    env: {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: mask(anonKey),
      SUPABASE_SERVICE_ROLE_KEY: mask(serviceRole)
    },
    auth: {
      tokenEndpoint: supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token` : null
    }
  };

  if (!supabaseUrl || !anonKey) {
    payload.ok = false;
    payload.reason = 'Missing SUPABASE_URL or SUPABASE_ANON_KEY.';
    return NextResponse.json(payload, { status: 500 });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      },
      cache: 'no-store'
    });

    payload.authHealth = {
      ok: response.ok,
      status: response.status
    };
  } catch (error) {
    payload.ok = false;
    payload.authHealth = {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  return NextResponse.json(payload, { status: payload.ok ? 200 : 503 });
}

