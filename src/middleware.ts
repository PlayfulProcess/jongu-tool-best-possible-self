import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const host = request.headers.get('host') || ''
  const isProd = process.env.NODE_ENV === 'production'
  const isJongu = /\.?jongu\.org$/i.test(host)
  
  // Debug logging
  console.log('🔍 BPS Middleware Debug:', {
    host,
    isProd,
    isJongu,
    url: request.url
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Surgical approach: only widen auth-token domain, leave refresh alone
            const isSbAuth = name.startsWith('sb-') && name.endsWith('-auth-token')
            const isSbRefresh = name.startsWith('sb-') && name.endsWith('-refresh-token')
            
            if (isProd && isJongu && isSbAuth) {
              console.log('🎯 BPS Setting cross-domain cookie:', { name, domain: '.jongu.org' })
              supabaseResponse.cookies.set({
                name,
                value,
                domain: '.jongu.org',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
                ...options
              })
            } else if (!isSbRefresh) {
              // Set normally for non-refresh tokens
              supabaseResponse.cookies.set(name, value, options)
            } else {
              // Leave refresh token untouched
              supabaseResponse.cookies.set(name, value, options)
            }
          })
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}