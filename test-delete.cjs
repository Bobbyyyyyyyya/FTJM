const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
supabase.from('posts').delete().eq('id', '123e4567-e89b-12d3-a456-426614174000').select().then(console.log).catch(console.error);
