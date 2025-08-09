import { createClient } from '@/lib/supabase-client'

export async function signInWithEmail(email: string, returnTo?: string) {
  const supabase = createClient()
  const next = returnTo || window.location.href // return here after login
  
  console.log('Attempting to send magic link to:', email)
  console.log('Redirect URL will be:', `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`)
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
  
  if (error) {
    console.error('Magic link error:', error)
    throw error
  }
  
  console.log('Magic link sent successfully:', data)
  return data
}