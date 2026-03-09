import { NextRequest } from 'next/server';
import legacyHandler from '@/api/data/imports';
import { AnyObjectSchema, runLegacyHandler } from '@/app/api/_lib/legacyAdapter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler);
}

export async function PUT(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler, AnyObjectSchema);
}
