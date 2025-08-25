import { PostgrestError } from '@supabase/supabase-js'

export interface AppError {
  type: 'network' | 'auth' | 'validation' | 'permission' | 'notFound' | 'server' | 'unknown'
  message: string
  originalError?: unknown
  retryable?: boolean
}

export const createError = (
  type: AppError['type'],
  message: string,
  originalError?: unknown,
  retryable = false
): AppError => ({
  type,
  message,
  originalError,
  retryable,
})

export const parseSupabaseError = (error: PostgrestError | Error): AppError => {
  const message = error.message.toLowerCase()

  // Authentication errors
  if (message.includes('email not confirmed')) {
    return createError('auth', 'Please check your email and click the confirmation link to activate your account.')
  }
  
  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return createError('auth', 'Invalid email or password. Please check your credentials and try again.')
  }
  
  if (message.includes('email already registered') || message.includes('already registered')) {
    return createError('auth', 'An account with this email already exists. Try signing in instead.')
  }

  if (message.includes('signup is disabled')) {
    return createError('auth', 'Account registration is currently disabled. Please contact support.')
  }

  // Permission errors
  if (message.includes('permission denied') || message.includes('insufficient_privilege')) {
    return createError('permission', 'You do not have permission to perform this action.')
  }

  // Not found errors
  if (message.includes('not found') || message.includes('no rows')) {
    return createError('notFound', 'The requested resource was not found.')
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return createError('network', 'Network error. Please check your connection and try again.', error, true)
  }

  // Server errors
  if (message.includes('internal server error') || message.includes('server error')) {
    return createError('server', 'Server error. Please try again later.', error, true)
  }

  // Database constraint errors
  if (message.includes('duplicate key value') || message.includes('violates unique constraint')) {
    return createError('validation', 'This item already exists. Please try a different value.')
  }

  if (message.includes('violates foreign key constraint')) {
    return createError('validation', 'Referenced item does not exist.')
  }

  if (message.includes('violates check constraint') || message.includes('violates not-null constraint')) {
    return createError('validation', 'Invalid data provided. Please check your input.')
  }

  // Default fallback
  return createError('unknown', error.message || 'An unexpected error occurred. Please try again.', error, true)
}

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof Error) {
    return parseSupabaseError(error).message
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return parseSupabaseError(error as Error).message
  }
  
  return 'An unexpected error occurred. Please try again.'
}

export const isRetryableError = (error: unknown): boolean => {
  if (typeof error === 'string') {
    return false
  }
  
  if (error instanceof Error) {
    const appError = parseSupabaseError(error)
    return appError.retryable || false
  }
  
  return false
}

// Retry utility
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
}