import { setApiResponseHeaders } from './_lib/backend.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STATE_TABLE = process.env.ONE82_SUPABASE_STATE_TABLE || 'one82_state';

const canUseSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

type HealthPayload = {
  ok: boolean;
  service: 'one82-api';
  timestamp: string;
  supabase: {
    configured: boolean;
    connected: boolean;
    table: string;
    message?: string;
  };
};

export default async function handler(_req: any, res: any) {
  setApiResponseHeaders(res, 'public-short');

  const payload: HealthPayload = {
    ok: true,
    service: 'one82-api',
    timestamp: new Date().toISOString(),
    supabase: {
      configured: canUseSupabase,
      connected: false,
      table: STATE_TABLE
    }
  };

  if (!canUseSupabase) {
    payload.supabase.message = 'Supabase env vars not configured. Running in memory fallback mode.';
    res.status(200).json(payload);
    return;
  }

  try {
    const query = `${SUPABASE_URL}/rest/v1/${STATE_TABLE}?select=tenant_id&limit=1`;
    const response = await fetch(query, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY || '',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`
      }
    });

    if (response.ok) {
      payload.supabase.connected = true;
      res.status(200).json(payload);
      return;
    }

    payload.ok = false;
    payload.supabase.message = `Supabase request failed (${response.status}). Check table and service role key.`;
    res.status(503).json(payload);
  } catch {
    payload.ok = false;
    payload.supabase.message = 'Unable to reach Supabase. Check network and project URL.';
    res.status(503).json(payload);
  }
}
