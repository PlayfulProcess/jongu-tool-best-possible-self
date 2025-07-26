'use client'

import { useState } from 'react'

export type PrivacySetting = 'private' | 'save_private' | 'public_blog' | 'research_consent'

interface PrivacySettingsProps {
  defaultSetting?: PrivacySetting
  onChange: (setting: PrivacySetting) => void
}

export function PrivacySettings({ defaultSetting = 'private', onChange }: PrivacySettingsProps) {
  const [selected, setSelected] = useState<PrivacySetting>(defaultSetting)

  const handleChange = (setting: PrivacySetting) => {
    setSelected(setting)
    onChange(setting)
  }

  const options = [
    {
      value: 'private' as const,
      label: 'Private Mode',
      description: 'Nothing gets saved - completely private session'
    },
    {
      value: 'save_private' as const,
      label: 'Save Privately',
      description: 'Save for your personal use only - never shared'
    },
    {
      value: 'public_blog' as const,
      label: 'Public Blog Post',
      description: 'Make available for others to read and comment on'
    },
    {
      value: 'research_consent' as const,
      label: 'Research Consent',
      description: 'Allow us to use anonymized data to improve the AI model'
    }
  ]

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900">Data Privacy Settings</h3>
      <p className="text-sm text-gray-600">Choose how you want your writing to be handled:</p>
      
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="privacy-setting"
              value={option.value}
              checked={selected === option.value}
              onChange={() => handleChange(option.value)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}