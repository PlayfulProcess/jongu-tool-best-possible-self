import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Enable cross-domain cookie sharing
        storageKey: 'recursive-eco-auth',
        cookieOptions: {
          domain: process.env.NODE_ENV === 'production' ? '.recursive.eco' : undefined,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      },
    }
  )
}