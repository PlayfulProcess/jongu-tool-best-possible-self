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
        storageKey: 'recursive-eco-auth'
      },
      cookieOptions: {
        domain: '.recursive.eco',
        maxAge: 100000000,
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
    }
  )
}