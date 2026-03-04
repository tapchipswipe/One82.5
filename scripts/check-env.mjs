const mode = process.env.ONE82_CHECK_MODE || 'production';

const requiredByMode = {
  production: [
    'VITE_ENABLE_BACKEND_AUTH',
    'VITE_ENABLE_BACKEND_DATA',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY'
  ],
  demo: ['VITE_ENABLE_BACKEND_AUTH', 'VITE_ENABLE_BACKEND_DATA']
};

const required = requiredByMode[mode] || requiredByMode.production;
const missing = required.filter((key) => {
  const value = process.env[key];
  return typeof value !== 'string' || value.trim() === '';
});

if (missing.length > 0) {
  console.error(`❌ Missing required env vars for mode "${mode}":`);
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const masked = (value) => {
  if (!value) return '<empty>';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

console.log(`✅ Env check passed for mode "${mode}".`);
console.log(`- VITE_ENABLE_BACKEND_AUTH=${process.env.VITE_ENABLE_BACKEND_AUTH}`);
console.log(`- VITE_ENABLE_BACKEND_DATA=${process.env.VITE_ENABLE_BACKEND_DATA}`);
console.log(`- SUPABASE_URL=${process.env.SUPABASE_URL || '<empty>'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY=${masked(process.env.SUPABASE_SERVICE_ROLE_KEY || '')}`);
console.log(`- SUPABASE_ANON_KEY=${masked(process.env.SUPABASE_ANON_KEY || '')}`);
