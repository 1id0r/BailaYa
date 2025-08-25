'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Wifi, Bell } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const {
    isInstallable,
    isInstalled,
    isOffline,
    installApp,
    requestNotificationPermission,
  } = usePWA()

  useEffect(() => {
    // Check if user has dismissed the banner before
    const hasDismissed = localStorage.getItem('pwa-banner-dismissed') === 'true'
    setDismissed(hasDismissed)

    // Show banner if app is installable and not dismissed
    if (isInstallable && !isInstalled && !hasDismissed) {
      // Delay showing banner to not interrupt user immediately
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled])

  const handleInstall = async () => {
    const installed = await installApp()
    if (installed) {
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  const handleEnableNotifications = async () => {
    await requestNotificationPermission()
  }

  if (!showBanner || dismissed || isInstalled) return null

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-lg z-40 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Install BailaCheck</h3>
            <p className="text-sm text-white/90 mb-3">
              Get the full experience! Install our app for offline access and push notifications.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleInstall}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
              
              <button
                onClick={handleEnableNotifications}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-1"
              >
                <Bell className="w-4 h-4" />
                Enable Notifications
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1 -mt-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-4 left-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-sm z-50 flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">You&apos;re offline</span>
          <span className="text-xs opacity-90">Some features may be limited</span>
        </div>
      )}
    </>
  )
}

export default PWAInstallBanner