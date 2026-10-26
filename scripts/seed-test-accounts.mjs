const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const accounts = [
  {
    email: 'admin@example.com',
    full_name: 'Development Administrator',
    user_type: 'business',
    is_admin: true,
    onboarded: true,
    phone_verified: true,
    is_verified: true,
  },
  {
    email: 'user@example.com',
    full_name: 'Development Worker',
    user_type: 'worker',
    is_admin: false,
    onboarded: true,
    phone_verified: true,
    is_verified: true,
  },
  {
    email: 'employer@example.com',
    full_name: 'Development Employer',
    user_type: 'farmer',
    is_admin: false,
    onboarded: true,
    phone_verified: true,
    is_verified: true,
  },
  {
    email: 'pending@example.com',
    full_name: 'Pending Development User',
    user_type: 'worker',
    is_admin: false,
    onboarded: false,
    phone_verified: false,
    is_verified: false,
  },
];

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
};

async function request(path, options = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body?.msg === 'string' ? body.msg : typeof body?.message === 'string' ? body.message : 'Supabase request failed';
    throw new Error(`${response.status}: ${message}`);
  }
  return body;
}

async function findUser(email) {
  const body = await request('/auth/v1/admin/users?page=1&per_page=1000');
  return body.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function seedAccount(account) {
  const existingUser = await findUser(account.email);
  const createdUser = existingUser || await request('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: account.email,
      password: 'Password123!',
      email_confirm: account.email !== 'pending@example.com',
      user_metadata: { full_name: account.full_name },
    }),
  });
  const user = createdUser.user || createdUser;

  await request(`/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      email: account.email,
      password: 'Password123!',
      email_confirm: account.email !== 'pending@example.com',
      user_metadata: { full_name: account.full_name },
    }),
  });

  await request('/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: user.id,
      full_name: account.full_name,
      user_type: account.user_type,
      is_admin: account.is_admin,
      onboarded: account.onboarded,
      phone_verified: account.phone_verified,
      is_verified: account.is_verified,
      is_banned: false,
      updated_at: new Date().toISOString(),
    }),
  });

  console.log(`Seeded ${account.email} (${user.id})`);
}

for (const account of accounts) {
  await seedAccount(account);
}

console.log('Development test accounts are ready. Do not use these credentials in production.');
