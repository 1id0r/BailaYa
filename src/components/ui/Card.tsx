import { forwardRef, HTMLAttributes, ReactNode, memo } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'neuro'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  hover?: boolean
  interactive?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      rounded = 'xl',
      shadow = 'md',
      hover = false,
      interactive = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'transition-all',
      'duration-200',
    ]

    const variantClasses = {
      default: [
        'bg-background-elevated',
        'border',
        'border-border',
      ],
      elevated: [
        'bg-background-elevated',
      ],
      outlined: [
        'bg-background-elevated',
        'border-2',
        'border-border',
      ],
      glass: [
        'glass',
      ],
      neuro: [
        'neuro',
      ],
    }

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    }

    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
    }

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
    }

    const hoverClasses = hover
      ? [
          'hover:shadow-lg',
          'hover:-translate-y-1',
        ]
      : []

    const interactiveClasses = interactive
      ? [
          'cursor-pointer',
          'hover:shadow-lg',
          'hover:-translate-y-1',
          'active:scale-[0.98]',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-primary-500/20',
          'focus:ring-offset-2',
        ]
      : []

    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      paddingClasses[padding],
      roundedClasses[rounded],
      shadowClasses[shadow],
      ...hoverClasses,
      ...interactiveClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const Component = interactive ? 'button' : 'div'

    return (
      <Component
        ref={ref as any}
        className={allClasses}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

// Card Header Component
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      title,
      subtitle,
      action,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`flex items-start justify-between mb-4 ${className}`}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-foreground-secondary mt-1">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && (
          <div className="flex-shrink-0 ml-4">
            {action}
          </div>
        )}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// Card Content Component  
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  (
    {
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`text-foreground-secondary ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// Card Footer Component
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between'
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  (
    {
      align = 'left',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    }

    return (
      <div
        ref={ref}
        className={`flex items-center gap-3 mt-4 ${alignClasses[align]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export default memo(Card)