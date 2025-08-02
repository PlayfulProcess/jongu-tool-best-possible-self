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
      wellness_tools: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          url: string
          submitted_by: string
          approved: boolean
          active: boolean
          rating: number
          rating_count: number
          total_clicks: number
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
          approved?: boolean
          active?: boolean
          rating?: number
          rating_count?: number
          total_clicks?: number
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
          approved?: boolean
          active?: boolean
          rating?: number
          rating_count?: number
          total_clicks?: number
          created_at?: string
          updated_at?: string
        }
      }
      tool_ratings: {
        Row: {
          id: string
          tool_id: string
          user_id: string
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          user_id: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          tool_id?: string
          user_id?: string
          rating?: number
          created_at?: string
        }
      }
      tool_clicks: {
        Row: {
          id: string
          tool_id: string
          user_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          user_id?: string
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
      collaborations: {
        Row: {
          id: string
          name: string
          email: string
          website?: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          website?: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          website?: string
          message?: string
          created_at?: string
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