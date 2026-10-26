const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261026060000_secure_profile_and_phone_verification.sql'), 'utf8');
const userId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
async function database() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
      SELECT current_setting('request.jwt.claim.role', true);
    $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
  `);
  // Apply the original profile definition and RLS verbatim before the new migration.
  const baseline = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260926215056_create_profiles_and_news.sql'), 'utf8');
  await db.exec(baseline.slice(baseline.indexOf('-- Create profiles table'), baseline.indexOf('-- Create news_articles table')));
  await db.exec(`
    ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false,
      ADD COLUMN is_moderator boolean NOT NULL DEFAULT false,
      ADD COLUMN is_editor boolean NOT NULL DEFAULT false,
      ADD COLUMN is_banned boolean NOT NULL DEFAULT false,
      ADD COLUMN preferred_language text NOT NULL DEFAULT 'tr',
      ADD COLUMN notification_email text, ADD COLUMN onboarded boolean NOT NULL DEFAULT false,
      ADD COLUMN farm_name text, ADD COLUMN preferred_regions text[], ADD COLUMN preferred_jobs text[],
      ADD COLUMN experience_level text, ADD COLUMN primary_crops text[], ADD COLUMN phone text,
      ADD COLUMN phone_verified boolean NOT NULL DEFAULT false,
      ADD COLUMN is_verified boolean NOT NULL DEFAULT false, ADD COLUMN weather_location text,
      ADD COLUMN email_message_notifications boolean NOT NULL DEFAULT true,
      ADD COLUMN message_notification_email text, ADD COLUMN employer_message text;
    GRANT SELECT, INSERT ON profiles TO authenticated;
    GRANT UPDATE (full_name, user_type, city, region, latitude, longitude) ON profiles TO authenticated;
    GRANT ALL ON profiles TO service_role;
    CREATE FUNCTION set_moderator_status(uuid, boolean) RETURNS void LANGUAGE sql SECURITY DEFINER
      AS $$ UPDATE profiles SET is_moderator = $2 WHERE id = $1; $$;
    REVOKE ALL ON FUNCTION set_moderator_status(uuid, boolean) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION set_moderator_status(uuid, boolean) TO authenticated;
  `);
  await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261025125827_create_phone_verification_codes.sql'), 'utf8'));
  await db.exec(migration);
  await db.exec(migration); // New migrations must tolerate re-application.
  await db.exec(`INSERT INTO auth.users VALUES ('${userId}', now()), ('${otherId}', null);`);
  return db;
}

test('profile grants block role escalation while allowing onboarding settings', async () => {
  const db = await database();
  try {
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.role = 'authenticated'; SET request.jwt.claim.sub = '${userId}';`);
    await assert.rejects(db.exec(`INSERT INTO profiles(id, is_admin) VALUES ('${userId}', true)`), /permission denied/);
    await db.exec(`INSERT INTO profiles(id, full_name) VALUES ('${userId}', 'Applicant');`);
    await db.exec(`UPDATE profiles SET onboarded = true, preferred_jobs = ARRAY['Harvesting'], updated_at = now() WHERE id = '${userId}'`);
    const { rows } = await db.query('SELECT is_verified, onboarded, is_admin FROM profiles');
    assert.equal(rows[0].is_verified, true);
    assert.equal(rows[0].onboarded, true);
    assert.equal(rows[0].is_admin, false);
    for (const column of ['is_admin', 'is_moderator', 'is_editor', 'is_banned', 'is_verified', 'phone_verified']) {
      await assert.rejects(db.exec(`UPDATE profiles SET ${column} = true WHERE id = '${userId}'`), /permission denied/);
    }
    await assert.rejects(db.exec(`SELECT set_moderator_status('${userId}', true)`), /permission denied/);
    await assert.rejects(db.exec(`SELECT verify_phone_verification_code('${userId}', '+905321234567', 'hash')`), /permission denied/);
  } finally { await db.close(); }
});

test('OTP limits attempts, binds the code to its user, and consumes a successful code once', async () => {
  const db = await database();
  try {
    await db.exec(`INSERT INTO profiles(id) VALUES ('${userId}'), ('${otherId}'); SET ROLE service_role; SET request.jwt.claim.role = 'service_role';`);
    const phone = '+905321234567';
    await db.query(`SELECT set_phone_verification_code($1, 'correct', $2, now() + interval '10 minutes')`, [phone, userId]);
    await assert.rejects(db.query(`SELECT set_phone_verification_code($1, 'other', $2, now() + interval '10 minutes')`, [phone, userId]), /cooldown/);
    const verify = async (id, hash) => (await db.query('SELECT verify_phone_verification_code($1, $2, $3) AS result', [id, phone, hash])).rows[0].result;
    assert.equal((await verify(otherId, 'correct')).error, 'no_code');
    assert.equal((await verify(userId, 'wrong')).attempts_left, 4);
    assert.equal((await verify(userId, 'correct')).verified, true);
    assert.equal((await verify(userId, 'correct')).error, 'already_used');
    const { rows } = await db.query('SELECT phone_verified, phone FROM profiles WHERE id=$1', [userId]);
    assert.equal(rows[0].phone_verified, true);
    assert.equal(rows[0].phone, phone);
    await db.exec(`RESET ROLE; SET request.jwt.claim.role = 'authenticated'; SET ROLE authenticated; SET request.jwt.claim.sub = '${userId}';`);
    await db.query('UPDATE profiles SET phone=$1 WHERE id=$2', ['+905329999999', userId]);
    assert.equal((await db.query('SELECT phone_verified FROM profiles WHERE id=$1', [userId])).rows[0].phone_verified, false);
  } finally { await db.close(); }
});

test('OTP rejects expired codes and locks out after five failed attempts', async () => {
  const db = await database();
  try {
    await db.exec(`INSERT INTO profiles(id) VALUES ('${userId}'); SET request.jwt.claim.role = 'service_role';`);
    await db.query(`INSERT INTO phone_verification_codes(phone, user_id, code_hash, expires_at) VALUES ('expired', $1, 'hash', now() - interval '1 minute')`, [userId]);
    const verify = async (phone, hash) => (await db.query('SELECT verify_phone_verification_code($1, $2, $3) AS result', [userId, phone, hash])).rows[0].result;
    assert.equal((await verify('expired', 'hash')).error, 'expired');
    await db.query(`INSERT INTO phone_verification_codes(phone, user_id, code_hash, expires_at) VALUES ('valid', $1, 'hash', now() + interval '1 minute')`, [userId]);
    for (let i = 0; i < 5; i++) assert.equal((await verify('valid', 'wrong')).error, 'wrong_code');
    assert.equal((await verify('valid', 'hash')).error, 'too_many_attempts');
  } finally { await db.close(); }
});
