'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check if user came from an authenticated app
    const checkCrossAppAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fromApp = urlParams.get('from');
      const authHint = urlParams.get('auth_hint');
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is already authenticated
        setUser(session.user);
        setLoading(false);
        
        // Clean up URL parameters if they exist
        if (fromApp || authHint) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (authHint === 'true' && fromApp === 'channels') {
        // User came from channels but no session found locally
        // Try to refresh the session in case it exists in Supabase but not locally
        try {
          await supabase.auth.refreshSession();
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          
          if (refreshedSession?.user) {
            setUser(refreshedSession.user);
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.log('Could not restore session from channels:', error);
          setUser(null);
        }
        
        setLoading(false);
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Standard flow - no auth hint
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    checkCrossAppAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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