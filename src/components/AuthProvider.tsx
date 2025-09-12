'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

type Status = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextType {
  status: Status
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  status: 'loading',
  user: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const handledInitial = useRef(false)

  useEffect(() => {
    let mounted = true

    async function init() {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      
      setUser(session?.user ?? null)
      setStatus(session?.user ? 'authenticated' : 'unauthenticated')

      // Subscribe to auth changes, ignore duplicate INITIAL_SESSION (StrictMode)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (handledInitial.current) return
          handledInitial.current = true
        }
        setUser(session?.user ?? null)
        setStatus(session?.user ? 'authenticated' : 'unauthenticated')
      })

      return () => subscription.unsubscribe()
    }

    const cleanup = init()
    
    return () => {
      mounted = false
      cleanup.then(unsub => unsub?.())
    }
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ status, user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}