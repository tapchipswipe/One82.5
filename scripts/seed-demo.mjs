/**
 * Seed Supabase with two demo tenants and starter data.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... node scripts/seed-demo.mjs
 *
 * Notes:
 * - Creates/ensures Supabase Auth users:
 *   - demo-iso@one82.io / admin
 *   - demo-merchant@one82.io / admin
 * - Seeds tenant state blob + core domain tables so dashboards can roll up metrics.
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const headersServiceRole = () => ({
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
  'Content-Type': 'application/json'
});

const headersAuthAdmin = () => ({
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
  'Content-Type': 'application/json'
});

const DEMO_PASSWORD = 'admin';

const demoUsers = [
  { email: 'demo-iso@one82.io', role: 'iso', tenantId: 'tenant_demo_iso', name: 'Demo ISO' },
  { email: 'demo-merchant@one82.io', role: 'merchant', tenantId: 'tenant_demo_merchant', name: 'Demo Merchant' }
];

const nowIso = () => new Date().toISOString();

const demoTransactions = (tenantId) => ([
  {
    id: `seed_${tenantId}_tx_1`,
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    amount: 128.5,
    status: 'Completed',
    customer: 'Joe’s Pizza',
    items: ['2 slices', 'soda'],
    method: 'Visa',
    category: 'Uncategorized'
  },
  {
    id: `seed_${tenantId}_tx_2`,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    amount: 980,
    status: 'Completed',
    customer: 'Tech Gadgets',
    items: ['Accessory'],
    method: 'MasterCard',
    category: 'Uncategorized'
  },
  {
    id: `seed_${tenantId}_tx_3`,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    amount: 42,
    status: 'Pending',
    customer: 'Apex Gym',
    items: ['Membership'],
    method: 'Amex',
    category: 'Uncategorized'
  }
]);

const demoStatePayload = (tenantId, role) => {
  const txs = demoTransactions(tenantId);
  return {
    transactions: txs,
    notifications: [
      {
        id: `seed_${tenantId}_n1`,
        title: 'Seeded demo tenant',
        message: 'This is seeded demo data stored in Supabase.',
        type: 'info',
        read: false,
        timestamp: Date.now()
      }
    ],
    calendarEvents: [],
    importedMerchants: role === 'iso'
      ? [
          { name: 'Joe’s Pizza', email: 'owner@joespizza.demo', status: 'Active', monthlyVolume: '45000' },
          { name: 'Tech Gadgets', email: 'owner@techgadgets.demo', status: 'Active', monthlyVolume: '150000' }
        ]
      : [],
    importedTeam: role === 'iso'
      ? [
          { name: 'Alex Rep', email: 'alex.rep@demo.one82', role: 'rep', region: 'Northeast' },
          { name: 'Jordan Rep', email: 'jordan.rep@demo.one82', role: 'rep', region: 'Southeast' }
        ]
      : [],
    merchantInvites: [],
    inviteStrategy: 'csv-auto-invite',
    onboardingDeals: [],
    commissionRuns: [],
    buyRateProfiles: []
  };
};

const ensureAuthUser = async (email, password) => {
  // Search existing users by email.
  const listUrl = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const listResponse = await fetch(listUrl, { method: 'GET', headers: headersAuthAdmin() });
  if (listResponse.ok) {
    const body = await listResponse.json();
    const existing = Array.isArray(body?.users) ? body.users.find((u) => u?.email?.toLowerCase() === email.toLowerCase()) : null;
    if (existing) {
      console.log(`Auth user exists: ${email}`);
      return existing;
    }
  }

  // Create user.
  const createUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: headersAuthAdmin(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true
    })
  });

  if (!createResponse.ok) {
    const raw = await createResponse.text();
    throw new Error(`Failed to create auth user ${email}: ${raw}`);
  }

  const created = await createResponse.json();
  console.log(`Created auth user: ${email}`);
  return created;
};

const upsertState = async (tenantId, payload) => {
  const url = `${SUPABASE_URL}/rest/v1/one82_state?on_conflict=tenant_id`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headersServiceRole(),
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([{
      tenant_id: tenantId,
      payload,
      updated_at: nowIso()
    }])
  });
  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Failed to upsert one82_state for ${tenantId}: ${raw}`);
  }
};

const ensureTenant = async (tenantId) => {
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/one82_ensure_tenant`;
  await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      ...headersServiceRole(),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ p_tenant_id: tenantId })
  });

  const upsertUrl = `${SUPABASE_URL}/rest/v1/one82_tenants?on_conflict=tenant_id`;
  await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      ...headersServiceRole(),
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([{ tenant_id: tenantId, updated_at: nowIso() }])
  });
};

const seedProcessorTransactions = async (tenantId, transactions) => {
  await ensureTenant(tenantId);
  const existingUrl = `${SUPABASE_URL}/rest/v1/one82_processor_transactions?tenant_id=eq.${encodeURIComponent(tenantId)}&select=source_transaction_id&limit=5000`;
  const existingResponse = await fetch(existingUrl, {
    method: 'GET',
    headers: headersServiceRole()
  });
  const existingRows = existingResponse.ok ? await existingResponse.json() : [];
  const existingIds = new Set(
    Array.isArray(existingRows)
      ? existingRows.map((row) => String(row?.source_transaction_id || '')).filter(Boolean)
      : []
  );

  const rows = transactions
    .filter((tx) => tx?.id && !existingIds.has(String(tx.id)))
    .map((tx) => ({
    tenant_id: tenantId,
    source_transaction_id: tx.id,
    occurred_at: new Date(tx.date).toISOString(),
    amount: Number(tx.amount) || 0,
    currency: 'USD',
    status: tx.status,
    customer: tx.customer,
    items: Array.isArray(tx.items) ? tx.items : [],
    method: tx.method,
    category: tx.category,
    processor: 'demo',
    ingested_from: 'seed',
    raw_payload: tx,
    updated_at: nowIso()
  }));

  if (rows.length === 0) {
    return;
  }

  const url = `${SUPABASE_URL}/rest/v1/one82_processor_transactions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headersServiceRole(),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Failed to seed processor transactions for ${tenantId}: ${raw}`);
  }
};

const run = async () => {
  console.log('Seeding demo tenants...');
  if (!ANON_KEY) {
    console.warn('SUPABASE_ANON_KEY is not set. Backend password verification requires it.');
  }

  for (const user of demoUsers) {
    await ensureAuthUser(user.email, DEMO_PASSWORD);

    const payload = demoStatePayload(user.tenantId, user.role);
    await ensureTenant(user.tenantId);
    await upsertState(user.tenantId, payload);
    await seedProcessorTransactions(user.tenantId, payload.transactions);

    console.log(`Seeded tenant: ${user.tenantId} (${user.email})`);
  }

  console.log('Done.');
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

