import { createSupabaseClient } from '@playfulprocess/jongu-shared-config'

export const supabase = createSupabaseClient()

// Re-export Database type from shared config
export { type Database } from '@playfulprocess/jongu-shared-config'

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