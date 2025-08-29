'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import Card from './Card'

export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const AnimatedNotification = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose,
  position = 'top-right',
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50)
    
    // Auto-close timer
    const closeTimer = setTimeout(() => {
      handleClose()
    }, duration)

    // Progress bar animation
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100))
        return newProgress <= 0 ? 0 : newProgress
      })
    }, 100)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(closeTimer)
      clearInterval(progressTimer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300) // Match exit animation duration
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <AlertCircle className="w-5 h-5 text-error-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
    info: <Info className="w-5 h-5 text-info-500" />,
  }

  const colorClasses = {
    success: 'border-l-success-500 bg-success-50 dark:bg-success-950',
    error: 'border-l-error-500 bg-error-50 dark:bg-error-950',
    warning: 'border-l-warning-500 bg-warning-50 dark:bg-warning-950',
    info: 'border-l-info-500 bg-info-50 dark:bg-info-950',
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  }

  const animationClasses = isLeaving
    ? 'animate-slide-out-right opacity-0 translate-x-full scale-95'
    : isVisible
    ? 'animate-slide-in-right opacity-100 translate-x-0 scale-100'
    : 'opacity-0 translate-x-full scale-95'

  return (
    <div className={`fixed z-50 ${positionClasses[position]} max-w-sm w-full mx-4`}>
      <Card
        variant="elevated"
        className={`
          ${colorClasses[type]}
          border-l-4
          transition-all
          duration-300
          ease-out
          transform
          ${animationClasses}
          hover:scale-105
          cursor-pointer
          group
        `}
        onClick={handleClose}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {title}
              </h4>
              {message && (
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
              className="flex-shrink-0 text-foreground-tertiary hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 -mb-2 -mx-4">
            <div className="h-1 bg-background-tertiary">
              <div
                className="h-full transition-all duration-100 ease-linear"
                style={{
                  width: `${progress}%`,
                  backgroundColor: `var(--color-${type}-500)`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AnimatedNotification