import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './supabase'

export function createClient() {
  // Determine if we're on a jongu.org domain (including preview subdomains)
  const isJonguDomain = typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('.jongu.org') || 
     window.location.hostname === 'jongu.org')
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=')
            if (name && value) acc.push({ name, value })
            return acc
          }, [] as { name: string; value: string }[])
          return cookies
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            if (isJonguDomain) {
              const cookieString = `${name}=${value}; ${Object.entries({
                ...options,
                domain: '.jongu.org', // Force parent domain
                path: '/',
                secure: true,
                sameSite: 'lax'
              }).map(([k, v]) => `${k}=${v}`).join('; ')}`
              document.cookie = cookieString
            } else {
              // Standard cookie handling for non-jongu domains
              const cookieString = `${name}=${value}; ${Object.entries(options || {}).map(([k, v]) => `${k}=${v}`).join('; ')}`
              document.cookie = cookieString
            }
          })
        }
      }
    }
  )
}