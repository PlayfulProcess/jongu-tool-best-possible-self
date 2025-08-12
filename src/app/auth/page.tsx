'use client'

import { createClient } from '@/lib/supabase-client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthPage() {
  const supabase = createClient()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Welcome to Best Possible Self</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Sign in with your email and password</p>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: {
                background: '#2563eb',
                borderColor: '#2563eb',
                color: '#ffffff',
              },
              anchor: {
                color: '#2563eb',
              },
              label: {
                color: '#374151',
              },
              message: {
                color: '#374151',
              },
            }
          }}
          providers={[]}
          redirectTo={typeof window !== 'undefined' ? 
            `${window.location.protocol}//${window.location.host}/auth/callback?returnTo=${encodeURIComponent('/')}`
            : undefined}
          onlyThirdPartyProviders={false}
          showLinks={true}
          view="sign_in"
        />
      </div>
    </div>
  )
}