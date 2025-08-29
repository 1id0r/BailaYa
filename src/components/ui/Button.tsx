import { forwardRef, ButtonHTMLAttributes, ReactNode, memo } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  loadingText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = 'lg',
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'focus:ring-opacity-50',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
      'active:scale-95',
      'transform',
      'hover:shadow-lg',
      'hover:-translate-y-0.5',
      'relative',
      'overflow-hidden',
    ]

    const variantClasses = {
      primary: [
        'bg-gradient-to-r',
        'from-primary-600',
        'to-primary-700',
        'hover:from-primary-700',
        'hover:to-primary-800',
        'text-white',
        'shadow-lg',
        'shadow-primary-500/40',
        'hover:shadow-xl',
        'hover:shadow-primary-500/50',
        'focus:ring-primary-500',
        'ring-offset-2',
        'ring-offset-background',
        'border',
        'border-primary-500/20',
      ],
      secondary: [
        'bg-gradient-to-r',
        'from-secondary-600',
        'to-secondary-700',
        'hover:from-secondary-700',
        'hover:to-secondary-800',
        'text-white',
        'shadow-lg',
        'shadow-secondary-500/40',
        'hover:shadow-xl',
        'hover:shadow-secondary-500/50',
        'focus:ring-secondary-500',
        'ring-offset-2',
        'ring-offset-background',
        'border',
        'border-secondary-500/20',
      ],
      outline: [
        'border-2',
        'border-current',
        'bg-transparent',
        'text-primary-600',
        'dark:text-primary-400',
        'hover:bg-primary-50',
        'hover:dark:bg-primary-950',
        'focus:ring-primary-500',
      ],
      ghost: [
        'bg-transparent',
        'text-foreground-secondary',
        'hover:bg-background-tertiary',
        'hover:text-foreground',
        'focus:ring-primary-500',
        'transition-colors',
        'duration-200',
      ],
      destructive: [
        'bg-gradient-to-r',
        'from-error-600',
        'to-error-700',
        'hover:from-error-700',
        'hover:to-error-800',
        'text-white',
        'shadow-lg',
        'shadow-error-500/25',
        'hover:shadow-xl',
        'hover:shadow-error-500/30',
        'focus:ring-error-500',
      ],
      success: [
        'bg-gradient-to-r',
        'from-success-600',
        'to-success-700',
        'hover:from-success-700',
        'hover:to-success-800',
        'text-white',
        'shadow-lg',
        'shadow-success-500/40',
        'hover:shadow-xl',
        'hover:shadow-success-500/50',
        'focus:ring-success-500',
        'ring-offset-2',
        'ring-offset-background',
        'border',
        'border-success-500/20',
      ],
    }

    const sizeClasses = {
      sm: ['px-3', 'py-1.5', 'text-sm', 'gap-1.5'],
      md: ['px-4', 'py-2.5', 'text-sm', 'gap-2'],
      lg: ['px-6', 'py-3', 'text-base', 'gap-2.5'],
      xl: ['px-8', 'py-4', 'text-lg', 'gap-3'],
    }

    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    }

    const widthClasses = fullWidth ? 'w-full' : ''

    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      roundedClasses[rounded],
      widthClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        className={allClasses}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'xl' ? 24 : 16} />
        )}
        {!isLoading && leftIcon && leftIcon}
        
        {isLoading && loadingText ? loadingText : children}
        
        {!isLoading && rightIcon && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default memo(Button)