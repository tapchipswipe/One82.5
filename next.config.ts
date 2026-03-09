import type { NextConfig } from 'next';

const passthroughEnv = (key: string): string => process.env[key] || '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    VITE_ENABLE_BACKEND_AUTH: passthroughEnv('VITE_ENABLE_BACKEND_AUTH'),
    VITE_ENABLE_BACKEND_DATA: passthroughEnv('VITE_ENABLE_BACKEND_DATA'),
    VITE_ENABLE_LIVE_INTEGRATIONS: passthroughEnv('VITE_ENABLE_LIVE_INTEGRATIONS'),
    VITE_ENABLE_EXPERIMENTAL: passthroughEnv('VITE_ENABLE_EXPERIMENTAL'),
    VITE_DISABLE_AI_UI: passthroughEnv('VITE_DISABLE_AI_UI'),
    VITE_OVERSEER_EMAIL: passthroughEnv('VITE_OVERSEER_EMAIL'),
    VITE_AUTH_API_BASE: passthroughEnv('VITE_AUTH_API_BASE'),
    VITE_DATA_API_BASE: passthroughEnv('VITE_DATA_API_BASE')
  }
};

export default nextConfig;
