type RuntimeMode = 'development' | 'production' | 'test';

type EnvString = string | undefined;

const getEnv = (key: string): EnvString => process.env[key];

const getRequired = (key: string): string => {
  const value = getEnv(key);
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptional = (key: string, fallback = ''): string => {
  const value = getEnv(key);
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value;
};

const getOptionalBoolean = (key: string, fallback = false): boolean => {
  const value = getEnv(key);
  if (!value) return fallback;
  const normalized = value.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const getRuntimeMode = (): RuntimeMode => {
  const mode = getEnv('NODE_ENV');
  if (mode === 'production' || mode === 'test' || mode === 'development') {
    return mode;
  }
  return 'development';
};

export const env = {
  runtimeMode: getRuntimeMode(),
  isProduction: getRuntimeMode() === 'production',
  supabase: {
    url: getOptional('SUPABASE_URL'),
    anonKey: getOptional('SUPABASE_ANON_KEY', getOptional('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
    serviceRoleKey: getOptional('SUPABASE_SERVICE_ROLE_KEY')
  },
  app: {
    overseerEmail: getOptional('VITE_OVERSEER_EMAIL', 'owner@one82.io').toLowerCase(),
    enableBackendAuth: getOptionalBoolean('VITE_ENABLE_BACKEND_AUTH', false),
    enableBackendData: getOptionalBoolean('VITE_ENABLE_BACKEND_DATA', false),
    enableLiveIntegrations: getOptionalBoolean('VITE_ENABLE_LIVE_INTEGRATIONS', false),
    enableExperimental: getOptionalBoolean('VITE_ENABLE_EXPERIMENTAL', false),
    disableAiUi: getOptionalBoolean('VITE_DISABLE_AI_UI', false),
    authApiBase: getOptional('VITE_AUTH_API_BASE', ''),
    dataApiBase: getOptional('VITE_DATA_API_BASE', '')
  },
  tables: {
    state: getOptional('ONE82_SUPABASE_STATE_TABLE', 'one82_state'),
    loginUsers: getOptional('ONE82_SUPABASE_LOGIN_USERS_TABLE', 'one82_login_users'),
    loginSessions: getOptional('ONE82_SUPABASE_LOGIN_SESSIONS_TABLE', 'one82_login_sessions'),
    tenants: getOptional('ONE82_SUPABASE_TENANTS_TABLE', 'one82_tenants'),
    merchants: getOptional('ONE82_SUPABASE_MERCHANTS_TABLE', 'one82_merchants'),
    teamMembers: getOptional('ONE82_SUPABASE_TEAM_MEMBERS_TABLE', 'one82_team_members'),
    processorTransactions: getOptional('ONE82_SUPABASE_PROCESSOR_TRANSACTIONS_TABLE', 'one82_processor_transactions'),
    importJobs: getOptional('ONE82_SUPABASE_IMPORT_JOBS_TABLE', 'one82_import_jobs'),
    syncRuns: getOptional('ONE82_SUPABASE_SYNC_RUNS_TABLE', 'one82_sync_runs'),
    events: getOptional('ONE82_SUPABASE_EVENTS_TABLE', 'one82_events')
  },
  required: {
    supabaseUrl: (): string => getRequired('SUPABASE_URL'),
    supabaseServiceRoleKey: (): string => getRequired('SUPABASE_SERVICE_ROLE_KEY')
  }
};

export type AppEnv = typeof env;