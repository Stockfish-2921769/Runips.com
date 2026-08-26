import { createClient } from '@supabase/supabase-js';

// Client Components are also evaluated while Next.js produces the static export.
// Syntactically valid placeholders keep that build deterministic when local env
// files are absent; browser requests still require the real public credentials.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
