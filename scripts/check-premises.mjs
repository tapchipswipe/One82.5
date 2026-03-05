import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const root = process.cwd();

const checks = [];

const addCheck = (name, passed, details) => {
  checks.push({ name, passed, details });
};

const addSkippedCheck = (name, details) => {
  checks.push({ name, passed: true, details, skipped: true });
};

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

const requireFiles = [
  'package.json',
  'vercel.json',
  '.env.example',
  '.env.trial.example',
  'supabase/migrations/0001_one82_state.sql',
  'supabase/migrations/0002_one82_auth.sql',
  'supabase/migrations/0003_one82_performance.sql',
  'supabase/migrations/0004_one82_domain_foundation.sql',
  'supabase/migrations/0005_one82_operational_hardening.sql'
];

const missingFiles = requireFiles.filter((file) => !existsSync(path.join(root, file)));
addCheck('[local] Workspace essentials', missingFiles.length === 0, missingFiles.length === 0 ? 'All required baseline files are present.' : `Missing files: ${missingFiles.join(', ')}`);

try {
  const pkg = readJson(path.join(root, 'package.json'));
  const scripts = pkg.scripts || {};
  const requiredScripts = ['build', 'typecheck', 'lint', 'check', 'ops:env', 'ops:health', 'ops:premises'];
  const missingScripts = requiredScripts.filter((name) => typeof scripts[name] !== 'string');
  addCheck('[local] Quality scripts', missingScripts.length === 0, missingScripts.length === 0 ? 'Build/typecheck/lint/check and ops scripts are configured.' : `Missing scripts: ${missingScripts.join(', ')}`);
} catch (error) {
  addCheck('[local] Quality scripts', false, `Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const vercel = readJson(path.join(root, 'vercel.json'));
  const hasApiFunctionConfig = Boolean(vercel?.functions?.['api/**/*.ts']);
  const hasApiHeaders = Array.isArray(vercel?.headers) && vercel.headers.some((entry) => entry?.source === '/api/(.*)');
  addCheck('[vercel] Runtime policy', hasApiFunctionConfig && hasApiHeaders, hasApiFunctionConfig && hasApiHeaders ? 'API function runtime and API security headers are configured.' : 'Missing API function config and/or API header policy in vercel.json.');
} catch (error) {
  addCheck('[vercel] Runtime policy', false, `Failed to parse vercel.json: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const envExample = readFileSync(path.join(root, '.env.example'), 'utf8');
  const trialExample = readFileSync(path.join(root, '.env.trial.example'), 'utf8');
  const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
  const missingEnvExample = requiredEnv.filter((key) => !envExample.includes(`${key}=`));
  const missingTrialExample = requiredEnv.filter((key) => !trialExample.includes(`${key}=`));
  addCheck('[supabase] Env templates', missingEnvExample.length === 0 && missingTrialExample.length === 0, missingEnvExample.length === 0 && missingTrialExample.length === 0 ? 'Supabase env keys exist in both env templates.' : `Missing env keys in templates: ${[...missingEnvExample, ...missingTrialExample].join(', ')}`);
} catch (error) {
  addCheck('[supabase] Env templates', false, `Failed to read env templates: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  addCheck('[github] Origin remote', /github\.com[:/]/i.test(remote), /github\.com[:/]/i.test(remote) ? `Origin set to ${remote}` : `Origin is not a GitHub URL: ${remote}`);
} catch (error) {
  addCheck('[github] Origin remote', false, `Failed to read git origin: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  execSync('gh --version', { stdio: 'ignore' });
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    addCheck('[github] CLI auth', true, 'GitHub CLI is installed and authenticated.');
  } catch {
    addCheck('[github] CLI auth', false, 'GitHub CLI is installed but not authenticated. Run `gh auth login`.');
  }
} catch {
  addSkippedCheck('[github] CLI auth', 'GitHub CLI not installed; skipping auth check.');
}

try {
  execSync('vercel --version', { stdio: 'ignore' });
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf8' }).trim();
    addCheck('[vercel] CLI auth', Boolean(whoami), whoami ? `Authenticated as ${whoami}` : 'Vercel CLI returned empty identity.');
  } catch {
    addCheck('[vercel] CLI auth', false, 'Vercel CLI is installed but not authenticated. Run `vercel login`.');
  }
} catch {
  addSkippedCheck('[vercel] CLI auth', 'Vercel CLI not installed; skipping auth check.');
}

const healthBase = process.env.ONE82_HEALTH_URL;
if (healthBase && healthBase.trim()) {
  const healthUrl = `${healthBase.replace(/\/$/, '')}/api/health`;
  try {
    const healthJson = execSync(`curl -fsSL "${healthUrl}"`, { encoding: 'utf8' });
    const health = JSON.parse(healthJson);
    const connected = Boolean(health?.supabase?.configured && health?.supabase?.connected);
    addCheck('[supabase] Live health connectivity', connected, connected ? `Live health reports connected (${healthUrl}).` : `Live health reports disconnected (${healthUrl}).`);
  } catch (error) {
    addCheck('[supabase] Live health connectivity', false, `Failed health probe at ${healthUrl}: ${error instanceof Error ? error.message : String(error)}`);
  }
} else {
  addSkippedCheck('[supabase] Live health connectivity', 'Set ONE82_HEALTH_URL to enable live /api/health Supabase connectivity check.');
}

const tsTsxFiles = execSync("find . -type f \\( -name '*.ts' -o -name '*.tsx' \\) -not -path './node_modules/*' -not -path './dist/*' | wc -l", { encoding: 'utf8' }).trim();
addCheck('[local] Codebase inventory', true, `Tracked TypeScript files: ${tsTsxFiles}`);

const failed = checks.filter((item) => !item.passed);
for (const check of checks) {
  const symbol = check.skipped ? '⚪' : check.passed ? '✅' : '❌';
  console.log(`${symbol} ${check.name}: ${check.details}`);
}

if (failed.length > 0) {
  console.error(`\nPremises check failed: ${failed.length} check(s) need attention.`);
  process.exit(1);
}

console.log('\nArea check passed: local, github, vercel, and supabase baselines are aligned.');
