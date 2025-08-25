'use client'

import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-12 h-12 text-orange-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You&apos;re Offline
        </h1>
        
        <p className="text-gray-600 mb-6">
          It looks like you&apos;ve lost your internet connection. Check your network and try again.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>While offline, you can still:</p>
          <ul className="mt-2 space-y-1">
            <li>• View previously loaded events</li>
            <li>• Access your profile information</li>
            <li>• Browse cached content</li>
          </ul>
        </div>
      </div>
    </div>
  )
}