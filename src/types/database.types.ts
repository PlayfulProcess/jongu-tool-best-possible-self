export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email?: string
          full_name?: string
          avatar_url?: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string
          full_name?: string
          avatar_url?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string
          role?: string
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
          template_id?: string
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
          template_id?: string
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
          template_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      journal_templates: {
        Row: {
          id: number
          uuid: string
          user_id?: string
          name: string
          description?: string
          ui_prompt: string
          ai_prompt?: string
          is_system: boolean
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never // Generated always as identity
          uuid?: string
          user_id?: string
          name: string
          description?: string
          ui_prompt: string
          ai_prompt?: string
          is_system?: boolean
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never // Cannot update identity column
          uuid?: string
          user_id?: string
          name?: string
          description?: string
          ui_prompt?: string
          ai_prompt?: string
          is_system?: boolean
          is_private?: boolean
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
      tools: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          url: string
          submitted_by: string
          user_id?: string
          approved: boolean
          active: boolean
          star_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          url: string
          submitted_by: string
          user_id?: string
          approved?: boolean
          active?: boolean
          star_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          url?: string
          submitted_by?: string
          user_id?: string
          approved?: boolean
          active?: boolean
          star_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      tool_stars: {
        Row: {
          id: string
          tool_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          tool_id?: string
          user_id?: string
          created_at?: string
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          subscribed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          subscribed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          subscribed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          name: string
          email: string
          category: string
          url?: string
          description?: string
          message?: string
          organization?: string
          expertise?: string
          collaboration_type?: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          category: string
          url?: string
          description?: string
          message?: string
          organization?: string
          expertise?: string
          collaboration_type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          category?: string
          url?: string
          description?: string
          message?: string
          organization?: string
          expertise?: string
          collaboration_type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}