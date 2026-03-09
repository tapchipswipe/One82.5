import { NextRequest } from 'next/server';
import legacyHandler from '@/api/data/ops';
import { runLegacyHandler } from '@/app/api/_lib/legacyAdapter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler);
}
