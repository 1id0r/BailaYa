'use client'

import { WifiOff, RefreshCw, Calendar, User, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card variant="elevated" className="max-w-md animate-fade-in">
        <CardContent className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-warning-500/20 to-error-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float">
            <WifiOff className="w-12 h-12 text-warning-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            You&apos;re Offline
          </h1>
          
          <p className="text-foreground-secondary mb-8 leading-relaxed">
            It looks like you&apos;ve lost your internet connection. Check your network and try again.
          </p>
          
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
            size="lg"
            leftIcon={<RefreshCw className="w-5 h-5" />}
            className="mb-8 animate-bounce-in"
          >
            Try Again
          </Button>
          
          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              While offline, you can still:
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-xl">
                <Calendar className="w-5 h-5 text-primary-500" />
                <span className="text-foreground-secondary text-sm">View previously loaded events</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-xl">
                <User className="w-5 h-5 text-secondary-500" />
                <span className="text-foreground-secondary text-sm">Access your profile information</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-xl">
                <Search className="w-5 h-5 text-success-500" />
                <span className="text-foreground-secondary text-sm">Browse cached content</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}