import { NextRequest } from 'next/server';
import legacyHandler from '@/api/data/notifications/read';
import { AnyObjectSchema, runLegacyHandler } from '@/app/api/_lib/legacyAdapter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler, AnyObjectSchema);
}
