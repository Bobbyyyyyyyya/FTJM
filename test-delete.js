const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
supabase.from('posts').delete().eq('id', 'nonexistent').select().then(console.log).catch(console.error);
