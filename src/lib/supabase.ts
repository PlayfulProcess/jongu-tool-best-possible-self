import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
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