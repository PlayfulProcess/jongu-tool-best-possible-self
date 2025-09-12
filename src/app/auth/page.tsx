'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MagicLinkAuth } from '@/components/MagicLinkAuth'
import { useAuth } from '@/components/AuthProvider'

export default function AuthPage() {
  const router = useRouter()
  const { status } = useAuth()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  const handleClose = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Best Possible Self Tool</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Evidence-based future visioning exercise</p>
        
        <MagicLinkAuth 
          isOpen={true}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}