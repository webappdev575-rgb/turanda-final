export function validateEnvironment(env) {
  const errors = [];
  for (const name of ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) {
    try {
      const url = new URL(env[name]);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
      if (['yourdomain.com', 'your-project.supabase.co'].includes(url.hostname)) throw new Error();
    } catch { errors.push(`${name} must be a real HTTPS origin (no path, credentials, query, or fragment).`); }
  }
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!key || key.includes('your-') || key.startsWith('sb_secret_')) errors.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY to the public anon/publishable key.');
  if (key.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      if (payload.role !== 'anon') errors.push('The browser Supabase JWT must have the anon role.');
    } catch { errors.push('The browser Supabase JWT is invalid.'); }
  }
  if (env.NEXT_PUBLIC_APP_ENV !== 'production') errors.push('Set NEXT_PUBLIC_APP_ENV=production.');
  if (env.DEV_TEST_ACCOUNTS_ENABLED === 'true') errors.push('Disable DEV_TEST_ACCOUNTS_ENABLED for deployment.');
  if (!env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) errors.push('Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY for the login/signup UI.');
  if (!env.RECAPTCHA_SECRET_KEY) errors.push('Set RECAPTCHA_SECRET_KEY for server verification.');
  return errors;
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const errors = validateEnvironment(process.env);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Deployment environment checks passed (values were not printed).');
}
