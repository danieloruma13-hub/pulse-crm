const { createClient } = require('@supabase/supabase-js');
const { supabase: supabaseConfig } = require('./env');

if (!supabaseConfig.url || !supabaseConfig.key) {
  console.warn('SUPABASE_URL or SUPABASE_KEY missing — database calls will fail until .env is configured.');
}

const supabase = createClient(supabaseConfig.url, supabaseConfig.key, {
  auth: { persistSession: false },
});

module.exports = supabase;
