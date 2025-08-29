'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  renderTime: number
  componentMount: number
  rerenderCount: number
}

interface UsePerformanceMonitorProps {
  componentName: string
  enabled?: boolean
  logThreshold?: number
}

export const usePerformanceMonitor = ({
  componentName,
  enabled = process.env.NODE_ENV === 'development',
  logThreshold = 16, // 16ms = 60fps threshold
}: UsePerformanceMonitorProps) => {
  const renderCountRef = useRef(0)
  const mountTimeRef = useRef<number>(0)
  const lastRenderTimeRef = useRef<number>(0)
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    componentMount: 0,
    rerenderCount: 0,
  })

  // Track component mount time
  useEffect(() => {
    if (!enabled) return

    mountTimeRef.current = performance.now()
    metricsRef.current.componentMount = mountTimeRef.current

    return () => {
      const unmountTime = performance.now()
      const totalLifetime = unmountTime - mountTimeRef.current
      const currentMetrics = metricsRef.current
      const currentRenderCount = renderCountRef.current

      if (totalLifetime > logThreshold || currentRenderCount > 10) {
        console.group(`🔍 Performance Report: ${componentName}`)
        console.log(`📊 Component Lifetime: ${totalLifetime.toFixed(2)}ms`)
        console.log(`🔄 Total Renders: ${currentRenderCount}`)
        console.log(`⚡ Average Render Time: ${(currentMetrics.renderTime / currentRenderCount).toFixed(2)}ms`)
        console.log(`⏱️ Mount Time: ${currentMetrics.componentMount.toFixed(2)}ms`)
        console.groupEnd()
      }
    }
  }, [componentName, enabled, logThreshold])

  // Track render performance
  useEffect(() => {
    if (!enabled) return

    const renderStartTime = lastRenderTimeRef.current || performance.now()
    const renderEndTime = performance.now()
    const renderDuration = renderEndTime - renderStartTime

    renderCountRef.current += 1
    metricsRef.current.renderTime += renderDuration
    metricsRef.current.rerenderCount = renderCountRef.current

    // Log slow renders
    if (renderDuration > logThreshold) {
      console.warn(
        `🐌 Slow render detected in ${componentName}: ${renderDuration.toFixed(2)}ms (render #${renderCountRef.current})`
      )
    }

    lastRenderTimeRef.current = performance.now()
  })

  const markStart = useCallback((label: string) => {
    if (!enabled) return
    performance.mark(`${componentName}-${label}-start`)
  }, [componentName, enabled])

  const markEnd = useCallback((label: string) => {
    if (!enabled) return
    performance.mark(`${componentName}-${label}-end`)
    performance.measure(
      `${componentName}-${label}`,
      `${componentName}-${label}-start`,
      `${componentName}-${label}-end`
    )
  }, [componentName, enabled])

  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current }
  }, [])

  const logCustomMetric = useCallback((metric: string, value: number, unit = 'ms') => {
    if (!enabled) return
    console.log(`📈 ${componentName} - ${metric}: ${value.toFixed(2)}${unit}`)
  }, [componentName, enabled])

  return {
    markStart,
    markEnd,
    getMetrics,
    logCustomMetric,
    renderCount: renderCountRef.current,
  }
}

export default usePerformanceMonitor