import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Minimal route-client that forces domain=.jongu.org in prod
function createRouteClient(req: NextRequest, res: NextResponse) {
  const host = req.headers.get('host') || ''
  const isProd = process.env.NODE_ENV === 'production'
  const isJongu = /\.?jongu\.org$/i.test(host)
  const parentDomain = isProd && isJongu ? '.jongu.org' : undefined

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = parentDomain ? { ...options, domain: parentDomain } : options
            res.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const next = url.searchParams.get('next') || '/'
  const res = NextResponse.redirect(new URL(next, url))
  const supabase = createRouteClient(req, res)

  const code = url.searchParams.get('code')
  if (code) {
    // Works for magic links and OAuth PKCE flows
    await supabase.auth.exchangeCodeForSession(code)
  }
  return res
}