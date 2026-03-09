import { NextRequest } from 'next/server';
import legacyHandler from '@/api/auth/session';
import { runLegacyHandler } from '@/app/api/_lib/legacyAdapter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler);
}
