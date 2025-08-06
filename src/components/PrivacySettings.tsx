'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase-client'

export type DataSavingSetting = 'private' | 'save_private'

interface PrivacySettingsProps {
  defaultDataSetting?: DataSavingSetting
  defaultResearchConsent?: boolean
  onDataSettingChange: (setting: DataSavingSetting) => void
  onResearchConsentChange: (consent: boolean) => void
}

export function PrivacySettings({ 
  defaultDataSetting = 'private', 
  defaultResearchConsent = false,
  onDataSettingChange, 
  onResearchConsentChange 
}: PrivacySettingsProps) {
  const [dataSetting, setDataSetting] = useState<DataSavingSetting>(defaultDataSetting)
  const [researchConsent, setResearchConsent] = useState<boolean>(defaultResearchConsent)
  
  const { user } = useAuth()
  const supabase = createClient()

  const handleDataSettingChange = (setting: DataSavingSetting) => {
    // If switching to private mode, show confirmation popup
    if (setting === 'private' && dataSetting === 'save_private') {
      const confirmed = confirm(
        'Switching to Private Mode:\n\n' +
        '• No new data will be saved or collected\n' +
        '• Your existing entries remain saved and accessible\n' +
        '• Visit "My Entries" to delete old entries anytime\n' +
        '• Current chat session will continue in memory\n\n' +
        'Continue to Private Mode?'
      );
      
      if (!confirmed) {
        return; // Don't change if user cancels
      }
    }
    
    setDataSetting(setting)
    onDataSettingChange(setting)
  }


  const handleResearchConsentChange = (consent: boolean) => {
    setResearchConsent(consent)
    onResearchConsentChange(consent)
  }

  const dataSavingOptions = [
    {
      value: 'private' as const,
      label: 'Do Not Save',
      description: 'Nothing gets saved - completely private session'
    },
    {
      value: 'save_private' as const,
      label: 'Save',
      description: 'Save for your personal use - securely stored and private'
    }
  ]

  return (
    <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Data Privacy Settings</h3>
        <p className="text-sm text-gray-600">Choose how you want your writing to be handled:</p>
      </div>
      
      {/* Data Saving Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-800">Data Saving</h4>
        {dataSavingOptions.map((option) => (
          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="data-saving-setting"
              value={option.value}
              checked={dataSetting === option.value}
              onChange={() => handleDataSettingChange(option.value)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Research Consent Toggle - Only show if not in Private Mode */}
      {dataSetting !== 'private' && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Product Improvement</h4>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={researchConsent}
              onChange={(e) => handleResearchConsentChange(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                Research Consent
              </div>
              <div className="text-xs text-gray-500">
                Allow us to use anonymized data to improve the AI (completely separate from your privacy choice above)
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}