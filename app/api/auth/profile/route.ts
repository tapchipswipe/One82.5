import { NextRequest } from 'next/server';
import { z } from 'zod';
import legacyHandler from '@/api/auth/profile';
import { runLegacyHandler } from '@/app/api/_lib/legacyAdapter';

export const runtime = 'nodejs';

const ProfileBodySchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['merchant', 'iso', 'overseer']),
    onboardingComplete: z.boolean(),
    credits: z.number(),
    plan: z.enum(['Free', 'Pro', 'Enterprise']),
    businessType: z.string().optional(),
    organizationName: z.string().optional()
  })
});

export async function PUT(request: NextRequest) {
  return runLegacyHandler(request, legacyHandler, ProfileBodySchema);
}
