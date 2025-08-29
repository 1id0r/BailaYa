'use client'

import { Suspense } from 'react'
import Navigation from './Navigation'

const NavigationFallback = () => (
  <div className="h-20 bg-background/95 backdrop-blur-2xl border-b border-border" />
)

export default function NavigationWrapper() {
  return (
    <Suspense fallback={<NavigationFallback />}>
      <Navigation />
    </Suspense>
  )
}