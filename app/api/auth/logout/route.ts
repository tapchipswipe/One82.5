import { type NextRequest } from 'next/server';
import handler from '../../_legacy/handlers/auth/logout';
import { runLegacyApiHandler } from '../../_legacy/adapter';

export async function POST(request: NextRequest) {
  return runLegacyApiHandler(request, handler);
}

