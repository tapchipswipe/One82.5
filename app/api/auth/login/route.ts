import { type NextRequest } from 'next/server';
import handler from '../../../../legacy-handlers/auth/login';
import { runLegacyApiHandler } from '../../_legacy/adapter';

export async function POST(request: NextRequest) {
  return runLegacyApiHandler(request, handler);
}

