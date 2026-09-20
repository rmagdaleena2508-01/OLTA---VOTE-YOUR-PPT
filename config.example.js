/* Copy this file to config.js and fill it in. config.js is ignored by git.
 *
 * The anon key belongs in the browser — that is what it is for. It can only do
 * what the row level policies in supabase/02-policies.sql allow.
 *
 * The service_role key must never be put here, committed, or pasted into any
 * file in this repository. It bypasses every policy.
 */
window.PODIUM_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT-REF.supabase.co',
  supabaseAnonKey: 'YOUR-ANON-PUBLIC-KEY',

  /* The public base URL of the R2 bucket, or a worker in front of it. Rendered
     deck pages are read from here. Originals are never served from it. */
  filesBaseUrl: 'https://files.YOUR-DOMAIN.com',
};
