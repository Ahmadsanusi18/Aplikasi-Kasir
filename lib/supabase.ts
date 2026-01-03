import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://akxkeksrblcwbngxmbyj.supabase.co';
const supabaseAnonKey = 'sb_publishable_QJ4b8Nmp8xe0y55FHW8DTA_oQp-lQ16';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);