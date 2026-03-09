import { NextRequest } from 'next/server';
import { z } from 'zod';
import legacyHandler from '@/api/auth/login';
import { runLegacyHandler } from '@/app/api/_lib/legacyAdapter';

export const runtime = 'nodejs';

const LoginBodySchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
  mode: z.enum(['demo', 'backend']).optional()
});

export async function POST(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler, LoginBodySchema);
}
