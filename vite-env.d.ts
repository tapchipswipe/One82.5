/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_ENABLE_BACKEND_AUTH: string;
  readonly VITE_ENABLE_BACKEND_DATA: string;
  readonly VITE_ENABLE_LIVE_INTEGRATIONS: string;
  readonly VITE_ENABLE_EXPERIMENTAL: string;
  readonly VITE_OVERSEER_EMAIL: string;
  readonly VITE_AUTH_API_BASE: string;
  readonly VITE_DATA_API_BASE: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
