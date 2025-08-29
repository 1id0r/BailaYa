'use client'

import { forwardRef, HTMLAttributes, useEffect, useState } from 'react'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient'
  showLabel?: boolean
  animated?: boolean
  striped?: boolean
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    animated = true,
    striped = false,
    className = '',
    ...props
  }, ref) => {
    const [animatedValue, setAnimatedValue] = useState(0)
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    useEffect(() => {
      if (animated) {
        const timer = setTimeout(() => {
          setAnimatedValue(percentage)
        }, 100)
        return () => clearTimeout(timer)
      } else {
        setAnimatedValue(percentage)
      }
    }, [percentage, animated])

    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    }

    const variantClasses = {
      default: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      gradient: 'bg-gradient-to-r from-primary-500 to-secondary-500',
    }

    const stripedClasses = striped
      ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]'
      : ''

    return (
      <div ref={ref} className={`relative ${className}`} {...props}>
        <div className={`w-full bg-background-tertiary rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div
            className={`h-full transition-all duration-700 ease-out ${variantClasses[variant]} ${stripedClasses} ${
              animated ? 'animate-pulse' : ''
            }`}
            style={{
              width: `${animatedValue}%`,
              transform: animated && animatedValue > 0 ? 'translateX(-100%)' : 'translateX(0)',
              animation: animated && animatedValue > 0 ? 'progress-fill 0.7s ease-out forwards' : 'none',
            }}
          />
        </div>
        {showLabel && (
          <div className="flex justify-between mt-2 text-sm text-foreground-secondary">
            <span>{Math.round(percentage)}%</span>
            <span>{value} / {max}</span>
          </div>
        )}
        <style jsx>{`
          @keyframes progress-fill {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar