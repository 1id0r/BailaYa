'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/contexts/ToastContext'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  serviceWorkerRegistered: boolean
  updateAvailable: boolean
}

export const usePWA = () => {
  const { showToast } = useToast()
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false, // Will be set in useEffect
    serviceWorkerRegistered: false,
    updateAvailable: false,
  })

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return

    // Set initial offline status
    setState(prev => ({ ...prev, isOffline: !navigator.onLine }))

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebApp = 'standalone' in navigator && (navigator as unknown as { standalone?: boolean }).standalone === true
      setState(prev => ({ ...prev, isInstalled: isStandalone || isInWebApp }))
    }

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          setState(prev => ({ ...prev, serviceWorkerRegistered: true }))
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, updateAvailable: true }))
                  showToast({
                    type: 'info',
                    title: 'App Update Available',
                    message: 'A new version of BailaCheck is available. Refresh to update.'
                  })
                }
              })
            }
          })

          console.log('Service Worker registered:', registration)
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setState(prev => ({ ...prev, isInstallable: true }))
    }

    // Handle online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }))
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }))
      showToast({
        type: 'info',
        title: 'You\'re offline',
        message: 'Some features may be limited while offline.'
      })
    }

    // Handle app installed
    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      setDeferredPrompt(null)
      showToast({
        type: 'success',
        title: 'App Installed!',
        message: 'BailaCheck has been installed on your device.'
      })
    }

    checkInstalled()
    registerServiceWorker()

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showToast])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        return true
      } else {
        console.log('User dismissed the install prompt')
        return false
      }
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    } finally {
      setDeferredPrompt(null)
      setState(prev => ({ ...prev, isInstallable: false }))
    }
  }

  const refreshApp = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    }
  }

  // Request notification permission
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        showToast({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'You\'ll receive updates about new events near you!'
        })
      }
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  // Subscribe to push notifications
  const subscribeToPushNotifications = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY // You'll need to set this
      })

      // Send subscription to your server
      console.log('Push subscription:', subscription)
      
      // TODO: Send subscription to backend
      // await fetch('/api/push-subscription', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // })

      showToast({
        type: 'success',
        title: 'Push Notifications Enabled',
        message: 'You\'ll receive push notifications about events!'
      })

      return true
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    }
  }

  // Show a test notification
  const showTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('BailaCheck', {
        body: 'Test notification - you\'re all set!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge.png'
      })
    }
  }

  return {
    ...state,
    installApp,
    refreshApp,
    requestNotificationPermission,
    subscribeToPushNotifications,
    showTestNotification,
  }
}