import { type NextRequest } from 'next/server';
import handler from '../../_legacy/handlers/auth/session';
import { runLegacyApiHandler } from '../../_legacy/adapter';

export async function GET(request: NextRequest) {
  return runLegacyApiHandler(request, handler);
}

