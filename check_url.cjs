const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://ykhyofibslcmsjtxbmrt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { flowType: 'pkce' } });
supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'http://localhost/callback' } })
  .then(res => console.log(res.data.url));
