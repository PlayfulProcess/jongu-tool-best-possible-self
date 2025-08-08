import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './supabase'

export function createClient() {
  // Ensures session is persisted (not just in-memory)
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}