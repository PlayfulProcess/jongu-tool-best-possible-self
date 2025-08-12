import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { Database } from './supabase'

export async function createClient() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  // Check if we're on a jongu.org domain
  const isJonguDomain = host.endsWith('.jongu.org') || host === 'jongu.org'
  const cookieDomain = isJonguDomain ? '.jongu.org' : undefined

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Override domain for jongu.org sites
              const cookieOptions = cookieDomain 
                ? { ...options, domain: cookieDomain, path: '/', secure: true, sameSite: 'lax' as const }
                : options
              cookieStore.set(name, value, cookieOptions)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}