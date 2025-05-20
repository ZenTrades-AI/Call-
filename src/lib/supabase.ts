
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ezojixzywnxkmblkmqcy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6b2ppeHp5d254a21ibGttcWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTY2NTEsImV4cCI6MjA2Mjc5MjY1MX0.IPzFdV97zPKW469F9Y-fSZLVbecWVX956HPNA_jAvRk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
