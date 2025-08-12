import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './supabase'

export function createClient() {
  // Determine if we're on a jongu.org domain
  const isJonguDomain = typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('.jongu.org') || 
     window.location.hostname === 'jongu.org')
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Set domain to .jongu.org in production for cross-subdomain auth
        ...(isJonguDomain && {
          getAll() {
            const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
              const [name, value] = cookie.split('=')
              acc.push({ name, value })
              return acc
            }, [] as { name: string; value: string }[])
            return cookies
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieString = `${name}=${value}; ${Object.entries({
                ...options,
                domain: '.jongu.org', // Force parent domain
                path: '/',
                secure: true,
                sameSite: 'lax'
              }).map(([k, v]) => `${k}=${v}`).join('; ')}`
              document.cookie = cookieString
            })
          }
        })
      }
    }
  )
}