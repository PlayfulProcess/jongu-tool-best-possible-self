import { createClient } from '@/lib/supabase-client'

export async function signInWithEmail(email: string, returnTo?: string) {
  const supabase = createClient()
  const next = returnTo || window.location.href // return here after login
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
}