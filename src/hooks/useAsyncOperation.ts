import { useState, useCallback } from 'react'
import { getErrorMessage, withRetry } from '@/lib/errors'
import { useToast } from '@/contexts/ToastContext'

interface AsyncOperationState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface AsyncOperationOptions {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  enableRetry?: boolean
  maxRetries?: number
}

export const useAsyncOperation = <T = unknown>(
  options: AsyncOperationOptions = {}
) => {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    enableRetry = false,
    maxRetries = 3,
  } = options

  const { showToast } = useToast()
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const result = enableRetry
          ? await withRetry(operation, maxRetries)
          : await operation()

        setState(prev => ({ ...prev, data: result, isLoading: false }))

        if (showSuccessToast) {
          showToast({
            type: 'success',
            title: 'Success',
            message: successMessage,
          })
        }

        return result
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))

        if (showErrorToast) {
          showToast({
            type: 'error',
            title: 'Error',
            message: errorMessage,
          })
        }

        return null
      }
    },
    [showToast, showSuccessToast, showErrorToast, successMessage, enableRetry, maxRetries]
  )

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}