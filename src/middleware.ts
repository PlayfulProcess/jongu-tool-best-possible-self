import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const host = request.headers.get('host') || ''
  const isProd = process.env.NODE_ENV === 'production'
  const isRecursive = /\.?recursive\.eco$/i.test(host)

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
            // For production jongu.org, set auth cookies with wider domain for SSO
            const isSbAuth = name.startsWith('sb-') && name.endsWith('-auth-token')
            
            if (isProd && isRecursive && isSbAuth) {
              // Set cross-domain cookie for SSO between recursive.eco subdomains
              supabaseResponse.cookies.set({
                name,
                value,
                domain: '.recursive.eco',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
                ...options
              })
            } else {
              // Set normally for other cookies and environments
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
     * - api routes
     * - auth/callback (handled separately)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}