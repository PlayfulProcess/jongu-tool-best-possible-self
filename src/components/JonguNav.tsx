'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface NetworkChannel {
  name: string;
  url: string;
  description: string;
  comingSoon?: boolean;
}

export const JONGU_NETWORK: Record<string, NetworkChannel> = {
  main: {
    name: "Jongu Collective",
    url: "https://jongu.org",
    description: "Gateway to wellness channels"
  },
  wellness: {
    name: "Wellness",
    url: "https://wellness.jongu.org",
    description: "Mental health resources"
  },
  parents: {
    name: "Parents",
    url: "https://parents.jongu.org",
    description: "Parenting support",
    comingSoon: true
  },
  developers: {
    name: "Developers",
    url: "https://developers.jongu.org",
    description: "Code with purpose",
    comingSoon: true
  },
  tools: {
    name: "Tools",
    url: "https://tools.jongu.org",
    description: "Wellness tools collection"
  }
};

interface JonguNavProps {
  currentChannel?: keyof typeof JONGU_NETWORK;
}

export default function JonguNav({ currentChannel }: JonguNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        <span className="hidden sm:inline">Jongu Network</span>
        <span className="sm:hidden">Network</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            {Object.entries(JONGU_NETWORK).map(([key, channel]) => (
              <a
                key={key}
                href={channel.url}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  key === currentChannel ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                } ${channel.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={channel.comingSoon ? (e) => e.preventDefault() : undefined}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {channel.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {channel.description}
                    </div>
                  </div>
                  {channel.comingSoon && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      Soon
                    </span>
                  )}
                </div>
              </a>
            ))}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <a 
                href="https://github.com/PlayfulProcess"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Open Source
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}