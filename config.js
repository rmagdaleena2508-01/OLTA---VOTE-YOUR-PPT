/* Podium — where the site finds its backend.
 *
 * The key below is the *publishable* key. It is designed to sit in a browser:
 * everything it can do is decided by the row-level policies in
 * supabase/02-policies.sql. That is why it can live in a public repository.
 *
 * The service_role key is the opposite — it ignores every policy. It must never
 * be put in this file, in a workflow, or anywhere the browser can reach.
 */
window.PODIUM_CONFIG = {
  supabaseUrl: 'https://hfetqtgvscyrmiesdswk.supabase.co',
  supabaseKey: 'sb_publishable_GLdAFKkyG2FKH9rmzyaTDQ_U5zNNqwV',

  /* Rendered deck pages are read from here once the R2 bucket is enabled.
     Leave it empty until then — the site falls back to browser storage. */
  filesBaseUrl: '',
};
