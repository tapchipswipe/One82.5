import { execFileSync } from 'child_process';

const baseUrl = process.env.ONE82_HEALTH_URL || 'http://localhost:3000';
const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
const url = `${normalizedBaseUrl}/api/health`;

const isVercelDeploymentUrl = (value) => /https:\/\/.+\.vercel\.app$/i.test(value);

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractJsonObject = (raw) => {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  return safeJsonParse(raw.slice(start, end + 1));
};

const canUseVercelCli = () => {
  try {
    execFileSync('vercel', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const runVercelCurl = () => {
  const output = execFileSync(
    'vercel',
    ['curl', '/api/health', '--deployment', normalizedBaseUrl],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const body = extractJsonObject(output);
  if (!body) {
    throw new Error('`vercel curl` succeeded but returned a non-JSON health payload.');
  }

  return body;
};

const shouldTryVercelCurlFallback = (status, contentType, rawBody) => {
  if (!isVercelDeploymentUrl(normalizedBaseUrl)) return false;
  if (status !== 401 && status !== 403) return false;
  const maybeHtml = /text\/html/i.test(contentType || '') || /<!doctype html>/i.test(rawBody || '');
  return maybeHtml;
};

const validateHealthPayload = (body) => {
  if (!body?.ok) {
    console.error('❌ Health payload reports failure.');
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log('✅ Health check passed.');
  console.log(JSON.stringify(body, null, 2));
};

const run = async () => {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();
    const body = safeJsonParse(rawBody);

    if (shouldTryVercelCurlFallback(response.status, contentType, rawBody)) {
      if (!canUseVercelCli()) {
        console.error('❌ Health check is behind Vercel deployment protection and Vercel CLI is not available for authenticated fallback.');
        process.exit(1);
      }

      const fallbackBody = runVercelCurl();
      validateHealthPayload(fallbackBody);
      return;
    }

    if (!response.ok) {
      console.error(`❌ Health check failed with status ${response.status}`);
      if (body) {
        console.error(JSON.stringify(body, null, 2));
      } else {
        console.error(rawBody);
      }
      process.exit(1);
    }

    if (!body) {
      console.error('❌ Health endpoint returned non-JSON content.');
      console.error(rawBody);
      process.exit(1);
    }

    validateHealthPayload(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Health check request failed: ${message}`);
    process.exit(1);
  }
};

run();
