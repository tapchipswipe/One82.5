import { type NextRequest } from 'next/server';
import handler from '../../_legacy/handlers/auth/profile';
import { runLegacyApiHandler } from '../../_legacy/adapter';

export async function PUT(request: NextRequest) {
  return runLegacyApiHandler(request, handler);
}

