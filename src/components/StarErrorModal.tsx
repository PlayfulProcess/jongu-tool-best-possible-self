'use client';

interface StarErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function StarErrorModal({ isOpen, onClose, onRefresh }: StarErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">⭐ Already Starred</h3>
        
        <p className="text-gray-600 mb-4">
          {`You've already starred this tool. The page may need refreshing to show your current stars.`}
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This sync issue is a known behavior. We believe some friction 
            helps maintain a calmer, less addictive platform experience.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
          >
            Continue
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <a 
            href="https://recursive.eco/known-issues.html" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View all known issues →
          </a>
        </div>
      </div>
    </div>
  );
}