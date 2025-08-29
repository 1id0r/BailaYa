'use client'

import { forwardRef, HTMLAttributes } from 'react'

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'dance'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

const ModernSpinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', variant = 'default', color = 'primary', className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12',
    }

    const colorClasses = {
      primary: 'text-primary-500',
      secondary: 'text-secondary-500',
      success: 'text-success-500',
      warning: 'text-warning-500',
      error: 'text-error-500',
    }

    const baseClasses = `inline-flex items-center justify-center ${sizeClasses[size]} ${colorClasses[color]} ${className}`

    if (variant === 'dots') {
      return (
        <div ref={ref} className={`${baseClasses} gap-1`} {...props}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      )
    }

    if (variant === 'pulse') {
      return (
        <div ref={ref} className={baseClasses} {...props}>
          <div className="w-full h-full bg-current rounded-full animate-pulse opacity-75" />
        </div>
      )
    }

    if (variant === 'bars') {
      return (
        <div ref={ref} className={`${baseClasses} gap-0.5`} {...props}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-current rounded-full animate-pulse"
              style={{
                height: `${40 + Math.sin(i) * 20}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.2s',
              }}
            />
          ))}
        </div>
      )
    }

    if (variant === 'dance') {
      return (
        <div ref={ref} className={baseClasses} {...props}>
          <div className="relative">
            <div className="w-full h-full border-2 border-current border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border border-current border-b-transparent rounded-full animate-spin animate-reverse" />
          </div>
        </div>
      )
    }

    // Default spinner
    return (
      <div ref={ref} className={baseClasses} {...props}>
        <div className="w-full h-full border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
)

ModernSpinner.displayName = 'ModernSpinner'

export default ModernSpinner