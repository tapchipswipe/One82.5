import {
  getAuthFromRequest,
  getStateForTenant,
  parseBody,
  saveStateForTenant,
  setApiResponseHeaders,
  sendMethodNotAllowed,
  sendUnauthorized
} from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  note?: string;
  impactDirection: 'up' | 'down' | 'neutral';
  impactPercent: number;
  createdAt: number;
  updatedAt: number;
};

type Body = {
  events?: CalendarEvent[];
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET' && req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['GET', 'PUT']);
    return;
  }

  const auth = await getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);

  if (req.method === 'GET') {
    res.status(200).json({ events: state.calendarEvents || [] });
    return;
  }

  const body = await parseBody<Body>(req);
  const events = Array.isArray(body?.events) ? body.events : [];

  await saveStateForTenant(auth.session.tenantId, {
    ...state,
    calendarEvents: events
  } as any);

  res.status(200).json({ ok: true });
}
