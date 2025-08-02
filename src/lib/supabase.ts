import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const getSupabaseConfig = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

export const createSupabaseClient = () => {
  const config = getSupabaseConfig();
  return createClient<Database>(config.url, config.anonKey);
};

export const createSupabaseAdminClient = () => {
  const config = getSupabaseConfig();
  if (!config.serviceRoleKey) {
    throw new Error('Service role key is required for admin client');
  }
  return createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const supabase = createSupabaseClient();

// Re-export Database type for compatibility
export { type Database }

// Legacy type export for compatibility
export type LegacyDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email?: string
          full_name?: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string
          full_name?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title?: string
          content: string
          is_public: boolean
          research_consent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          content: string
          is_public?: boolean
          research_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          is_public?: boolean
          research_consent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          journal_entry_id?: string
          message: string
          role: 'user' | 'assistant'
          is_public: boolean
          research_consent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          journal_entry_id?: string
          message: string
          role: 'user' | 'assistant'
          is_public?: boolean
          research_consent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          journal_entry_id?: string
          message?: string
          role?: 'user' | 'assistant'
          is_public?: boolean
          research_consent?: boolean
          created_at?: string
        }
      }
    }
  }
}