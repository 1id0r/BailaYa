'use client'

import { 
  useState, 
  useRef, 
  useEffect, 
  forwardRef, 
  ImgHTMLAttributes,
  memo 
} from 'react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

export interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string
  alt: string
  fallbackSrc?: string
  placeholderComponent?: React.ReactNode
  threshold?: number
  rootMargin?: string
  fadeInDuration?: number
  blurPlaceholder?: boolean
  onLoad?: () => void
  onError?: () => void
}

const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(
  ({
    src,
    alt,
    fallbackSrc,
    placeholderComponent,
    threshold = 0.1,
    rootMargin = '50px',
    fadeInDuration = 300,
    blurPlaceholder = true,
    onLoad,
    onError,
    className = '',
    style,
    ...props
  }, ref) => {
    const [imageSrc, setImageSrc] = useState<string | undefined>(undefined)
    const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
    const [showImage, setShowImage] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)
    
    const { elementRef, isIntersecting } = useIntersectionObserver({
      threshold,
      rootMargin,
      triggerOnce: true,
    })

    // Start loading image when it intersects
    useEffect(() => {
      if (isIntersecting && !imageSrc) {
        setImageSrc(src)
      }
    }, [isIntersecting, src, imageSrc])

    // Handle image load and error events
    useEffect(() => {
      if (!imageSrc) return

      const img = new Image()
      img.onload = () => {
        setImageStatus('loaded')
        setTimeout(() => setShowImage(true), 50) // Small delay for smoother transition
        onLoad?.()
      }
      img.onerror = () => {
        setImageStatus('error')
        if (fallbackSrc) {
          setImageSrc(fallbackSrc)
        }
        onError?.()
      }
      img.src = imageSrc
    }, [imageSrc, fallbackSrc, onLoad, onError])

    const containerStyle = {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      ...style,
    }

    const imageStyle = {
      transition: `opacity ${fadeInDuration}ms ease-in-out, filter ${fadeInDuration}ms ease-in-out`,
      opacity: showImage ? 1 : 0,
      filter: blurPlaceholder && !showImage ? 'blur(10px)' : 'none',
    }

    const placeholderStyle = {
      position: 'absolute' as const,
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background-tertiary)',
      transition: `opacity ${fadeInDuration}ms ease-in-out`,
      opacity: showImage ? 0 : 1,
      pointerEvents: 'none' as const,
    }

    return (
      <div 
        ref={elementRef} 
        style={containerStyle}
        className={`inline-block ${className}`}
      >
        {/* Actual image */}
        {imageSrc && (
          <img
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
              imgRef.current = node
            }}
            src={imageSrc}
            alt={alt}
            style={imageStyle}
            {...props}
          />
        )}
        
        {/* Placeholder */}
        {!showImage && (
          <div style={placeholderStyle}>
            {placeholderComponent || (
              <div className="flex flex-col items-center justify-center text-foreground-tertiary">
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs">Loading...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Error state */}
        {imageStatus === 'error' && !fallbackSrc && (
          <div style={placeholderStyle}>
            <div className="flex flex-col items-center justify-center text-error-500">
              <svg
                className="w-8 h-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-xs">Failed to load</span>
            </div>
          </div>
        )}
      </div>
    )
  }
)

LazyImage.displayName = 'LazyImage'

export default memo(LazyImage)