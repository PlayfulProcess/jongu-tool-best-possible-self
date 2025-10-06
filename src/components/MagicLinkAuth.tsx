'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

interface MagicLinkAuthProps {
  isOpen: boolean
  onClose: () => void
}

export function MagicLinkAuth({ isOpen, onClose }: MagicLinkAuthProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    setLoading(false)
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Check your email for the magic link!')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sign In</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We&apos;ll send you a magic link to sign in instantly
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4 text-xs text-left space-y-1">
          <p className="text-blue-900 dark:text-blue-200">
            <strong>⚠️ Beta Notice:</strong> Magic links work best with Gmail accounts.
          </p>
          <p className="text-blue-800 dark:text-blue-300">
            • Emails come from <strong>pp@playfulprocess.com</strong>
          </p>
          <p className="text-blue-800 dark:text-blue-300">
            • Check your <strong>Spam folder</strong> if you don&apos;t see it
          </p>
          <p className="text-blue-800 dark:text-blue-300">
            • Issues? Email <strong>pp@playfulprocess.com</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            required
            disabled={loading}
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {message}
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Continue without signing in
        </button>
      </div>
    </div>
  )
}