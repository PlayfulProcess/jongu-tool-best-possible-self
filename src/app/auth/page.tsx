'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImprovedAuthModal } from '@/components/modals/ImprovedAuthModal'
import { createClient } from '@/lib/supabase-client'

export default function AuthPage() {
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  const handleCloseModal = () => {
    setShowAuthModal(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Best Possible Self Tool</h1>
        <p className="text-lg text-gray-600 mb-8">Evidence-based future visioning exercise</p>
        
        <ImprovedAuthModal 
          isOpen={showAuthModal}
          onClose={handleCloseModal}
          title="Welcome to Best Possible Self Tool"
          subtitle="Choose your preferred sign-in method"
        />
      </div>
    </div>
  )
}