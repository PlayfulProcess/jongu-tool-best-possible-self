'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase-client'
import { AIAssistant } from './AIAssistant'

interface JournalEntry {
  id: string
  title: string | null
  content: string
  is_public: boolean
  research_consent: boolean
  created_at: string
  updated_at: string
}

export function JournalDashboard() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const supabase = createClient()

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      console.error('Error loading entries:', err)
      setError('Failed to load journal entries')
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    if (user) {
      loadEntries()
    }
  }, [user, loadEntries])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPrivacyLabel = (entry: JournalEntry) => {
    if (entry.research_consent) {
      return 'Private + Research'
    }
    return 'Private'
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
      return
    }

    try {
      console.log('Attempting to delete entry:', entryId, 'for user:', user?.id)
      
      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user?.id) // Ensure user can only delete their own entries
        .select()

      console.log('Delete result:', { data, error })

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        throw new Error('No entry was deleted - entry may not exist or belong to user')
      }
      
      setEntries(entries.filter(e => e.id !== entryId))
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null)
      }

      console.log('Entry deleted successfully')
    } catch (err) {
      console.error('Error deleting entry:', err)
      alert(`Failed to delete entry: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journal entries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={loadEntries}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-serif text-gray-800">
          Your Journal Entries
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-3 font-sans">Beta</span>
        </h1>
        <p className="text-gray-600 mt-2">Review and continue reflecting on your best possible self</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No saved journal entries yet</p>
          <p className="text-gray-400 text-sm">Start writing and choose &quot;Save&quot; to see your entries here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entries List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Saved Entries ({entries.length})</h2>
            
            {entries.map((entry) => (
              <div 
                key={entry.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedEntry?.id === entry.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800 line-clamp-1">
                    {entry.title || 'Untitled Entry'}
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {getPrivacyLabel(entry)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                  {entry.content}
                </p>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{formatDate(entry.created_at)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEntry(entry.id)
                    }}
                    className="text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Entry Detail */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            {selectedEntry ? (
              <div className="border rounded-lg">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">
                      {selectedEntry.title || 'Untitled Entry'}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {getPrivacyLabel(selectedEntry)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatDate(selectedEntry.created_at)}
                  </p>
                  {selectedEntry.updated_at !== selectedEntry.created_at && (
                    <p className="text-sm text-gray-500">
                      Updated: {formatDate(selectedEntry.updated_at)}
                    </p>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 mb-6">
                      {selectedEntry.content}
                    </div>
                  </div>
                  
                  {/* AI Assistant for this entry */}
                  <AIAssistant 
                    content={selectedEntry.content}
                    dataSavingSetting="save_private"
                    researchConsent={selectedEntry.research_consent}
                    entryId={selectedEntry.id}
                  />
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <p className="text-gray-500">Select an entry to view and chat about it</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}