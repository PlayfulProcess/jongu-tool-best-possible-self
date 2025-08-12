import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Support both 'next' and 'returnTo' params for backward compatibility
  const next = searchParams.get('next') ?? searchParams.get('returnTo') ?? '/'
  
  const host = request.headers.get('host') || ''
  const isJonguDomain = host.endsWith('.jongu.org') || host === 'jongu.org'
  const cookieDomain = isJonguDomain ? '.jongu.org' : undefined

  if (code) {
    const response = NextResponse.redirect(new URL(next, origin))
    
    // Create a special supabase client that sets cookies on the response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = cookieDomain 
                ? { ...options, domain: cookieDomain, path: '/', secure: true, sameSite: 'lax' as const }
                : options
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}