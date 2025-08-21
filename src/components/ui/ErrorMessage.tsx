import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ErrorMessageProps {
  title?: string
  message?: string
  onRetry?: () => void
  showHomeButton?: boolean
  className?: string
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message = 'We encountered an error while loading your content.',
  onRetry,
  showHomeButton = false,
  className = ''
}: ErrorMessageProps) {
  const router = useRouter()

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="bg-red-50 rounded-full p-3 mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>
      
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        
        {showHomeButton && (
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        )}
      </div>
    </div>
  )
}

export function ErrorCard({ 
  title, 
  message, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md border border-red-200 ${className}`}>
      <ErrorMessage
        title={title}
        message={message}
        onRetry={onRetry}
        className="py-8"
      />
    </div>
  )
}

export function ErrorPage({ 
  title = 'Page not found', 
  message = 'The page you are looking for does not exist.',
  showHomeButton = true 
}: ErrorMessageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <ErrorMessage
        title={title}
        message={message}
        showHomeButton={showHomeButton}
      />
    </div>
  )
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to our servers. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  )
}

export function AuthError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Authentication Error"
      message="Your session has expired. Please sign in again to continue."
      onRetry={onRetry}
      showHomeButton={true}
    />
  )
}