
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tpvserzjhmyxjssabokm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnNlcnpqaG15eGpzc2Fib2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NjgwMjcsImV4cCI6MjA2NTI0NDAyN30.4cYrSzhNDG-Sd48_UO0rw2fnKtI5PasZaeoh8E4OLQg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
