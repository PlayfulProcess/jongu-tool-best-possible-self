import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
            // Surgical approach: Only modify domain for main auth token, not refresh tokens
            const isAuthCookie = name.includes('sb-') && name.includes('-auth-token')
            const isRefresh = name.includes('-refresh')
            const isProduction = process.env.NODE_ENV === 'production'
            const isJongu = request.headers.get('host')?.includes('jongu.org')

            if (isProduction && isJongu && isAuthCookie && !isRefresh) {
              // Only set domain for main auth cookie in production on jongu.org
              supabaseResponse.cookies.set(name, value, {
                ...options,
                domain: '.jongu.org',
                sameSite: 'lax',
                secure: true,
              })
            } else {
              // Keep original options for everything else (including refresh tokens)
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}