import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
      {text && (
        <p className="mt-2 text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 mx-4 sm:mx-0 animate-pulse">
      <div className="h-48 sm:h-56 bg-gray-200" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded-md" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-3/4" />
          <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-2/3" />
          <div className="h-4 bg-gray-200 rounded-md w-1/2" />
          <div className="h-4 bg-gray-200 rounded-md w-3/4" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-gray-200 rounded-lg" />
          <div className="flex-1 h-12 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function LoadingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </div>
  )
}

export function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="xl" text={text} />
    </div>
  )
}