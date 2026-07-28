import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check if credentials are supplied via env vars or localStorage custom config
const meta = import.meta as any;
const envUrl = meta.env?.VITE_SUPABASE_URL || meta.env?.NEXT_PUBLIC_SUPABASE_URL || '';
const envAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_url') || '' : '';
const localAnonKey = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_key') || '' : '';

const supabaseUrl = envUrl || localUrl;
const supabaseAnonKey = envAnonKey || localAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project.supabase.co') &&
  !supabaseUrl.includes('placeholder.supabase.co') &&
  supabaseAnonKey !== 'placeholder-anon-key'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function saveCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('custom_supabase_url', url);
      localStorage.setItem('custom_supabase_key', key);
    } else {
      localStorage.removeItem('custom_supabase_url');
      localStorage.removeItem('custom_supabase_key');
    }
    window.location.reload();
  }
}
