import { NextRequest } from 'next/server';
import legacyHandler from '@/api/auth/logout';
import { AnyObjectSchema, runLegacyHandler } from '@/app/api/_lib/legacyAdapter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler, AnyObjectSchema);
}
