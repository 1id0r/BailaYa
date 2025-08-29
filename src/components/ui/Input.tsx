import { forwardRef, InputHTMLAttributes, ReactNode, useState, memo } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  variant?: 'default' | 'filled' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isPassword?: boolean
  showPasswordToggle?: boolean
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      variant = 'default',
      size = 'md',
      isPassword = false,
      showPasswordToggle = false,
      fullWidth = true,
      className = '',
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    // Generate unique id if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    const baseInputClasses = [
      'transition-all',
      'duration-200',
      'border',
      'bg-background-secondary',
      'text-foreground',
      'placeholder:text-foreground-muted',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500/20',
      'focus:border-primary-500',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:bg-background-tertiary',
    ]

    const variantClasses = {
      default: [
        'border-border-input',
        'hover:border-border-focus',
      ],
      filled: [
        'border-transparent',
        'bg-background-tertiary',
        'hover:bg-background-elevated',
        'focus:bg-background-secondary',
      ],
      outline: [
        'border-2',
        'border-border-input',
        'bg-transparent',
        'hover:border-border-focus',
      ],
    }

    const sizeClasses = {
      sm: ['px-3', 'py-2', 'text-sm', 'rounded-md'],
      md: ['px-4', 'py-2.5', 'text-sm', 'rounded-lg'],
      lg: ['px-5', 'py-3', 'text-base', 'rounded-lg'],
    }

    const errorClasses = error
      ? [
          'border-error-500',
          'focus:border-error-500',
          'focus:ring-error-500/20',
          'pr-10'
        ]
      : []

    const leftPaddingClass = leftIcon ? 'pl-10' : ''
    const rightPaddingClass = (rightIcon || showPasswordToggle || error) ? 'pr-10' : ''

    const inputClasses = [
      ...baseInputClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      ...errorClasses,
      leftPaddingClass,
      rightPaddingClass,
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium mb-2 transition-colors ${
              error
                ? 'text-error-600'
                : isFocused
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-foreground-secondary'
            }`}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className={`${error ? 'text-error-500' : 'text-foreground-muted'}`}>
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            id={inputId}
            className={inputClasses}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {error && (
              <AlertCircle
                size={iconSize}
                className="text-error-500 mr-2"
                aria-hidden="true"
              />
            )}
            
            {showPasswordToggle && isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-foreground-muted hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={iconSize} />
                ) : (
                  <Eye size={iconSize} />
                )}
              </button>
            )}
            
            {!showPasswordToggle && rightIcon && (
              <span className={`${error ? 'text-error-500' : 'text-foreground-muted'}`}>
                {rightIcon}
              </span>
            )}
          </div>
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-error-600 animate-slide-down"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-foreground-tertiary"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default memo(Input)