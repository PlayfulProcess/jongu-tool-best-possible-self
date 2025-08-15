import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  // Handle magic link tokens
  if (token_hash && type === 'magiclink') {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'magiclink',
    })
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // Check if this is a password recovery flow
      if (type === 'recovery') {
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}/auth/update-password`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}/auth/update-password`)
        } else {
          return NextResponse.redirect(`${origin}/auth/update-password`)
        }
      }
      
      // All other auth flows go to the same place
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}