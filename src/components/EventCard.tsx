'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Heart, Check, Users, Share2, DollarSign, Sparkles, ChevronRight } from 'lucide-react'
import { Event, CheckinStatus } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Card, { CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface EventCardProps {
  event: Event & {
    checkinCount?: {
      going: number
      interested: number
    }
  }
  checkinStatus: CheckinStatus
  onStatusChange?: (eventId: string, status: CheckinStatus) => void
}

// Modern dance style colors with gradients
const DANCE_STYLE_COLORS: Record<string, string> = {
  'salsa': 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  'bachata': 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  'merengue': 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  'reggaeton': 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  'kizomba': 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'zouk': 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'chacha': 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'cha-cha': 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'cumbia': 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
}

const EventCard = memo(({ event, checkinStatus, onStatusChange }: EventCardProps) => {
  const { user } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [currentStatus, setCurrentStatus] = useState<CheckinStatus>(checkinStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this ${event.dance_styles?.join(', ')} event at ${event.venue_name}!`,
          url: `${window.location.origin}/events/${event.id}`,
        })
      } catch {
        // Silent fail for share cancellation
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`)
        showToast({ type: 'success', title: 'Event link copied to clipboard!' })
      } catch {
        showToast({ type: 'error', title: 'Unable to share event' })
      }
    }
  }

  const handleStatusChange = async (newStatus: CheckinStatus) => {
    if (!user) {
        showToast({ type: 'info', title: 'Please sign in to check in to events' })
      router.push('/auth/login')
      return
    }

    if (isUpdating) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('event_checkins')
        .upsert({
          user_id: user.id,
          event_id: event.id,
          status: newStatus,
        })

      if (error) throw error

      setCurrentStatus(newStatus)
      onStatusChange?.(event.id, newStatus)
      
      const statusText = newStatus === 'going' ? 'attending' : newStatus === 'interested' ? 'interested in' : 'removed from'
      showToast({ type: 'success', title: `You're now ${statusText} this event!` })
    } catch {
      showToast({ type: 'error', title: 'Failed to update status. Please try again.' })
    } finally {
      setIsUpdating(false)
    }
  }

  const eventDate = new Date(event.date_time)
  const isUpcoming = eventDate > new Date()
  const totalAttendees = (event.checkinCount?.going || 0) + (event.checkinCount?.interested || 0)

  return (
    <Card 
      variant="elevated" 
      padding="none" 
      hover
      className="group overflow-hidden animate-fade-in"
    >
      {/* Hero Image Section */}
      <div className="relative h-48 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status indicators */}
        <div className="absolute top-4 left-4 flex gap-2">
          {!isUpcoming && (
            <div className="px-2 py-1 bg-foreground-muted/80 backdrop-blur-sm text-white text-xs rounded-full font-medium">
              Past Event
            </div>
          )}
          {event.entry_price && (
            <div className="px-2 py-1 bg-success-500/80 backdrop-blur-sm text-white text-xs rounded-full font-medium flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${event.entry_price}
            </div>
          )}
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all hover:bg-white/30 hover:scale-110 active:scale-95"
          aria-label="Share event"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2">
            {event.title}
          </h3>
          <p className="text-white/80 text-sm font-medium">
            {event.venue_name}
          </p>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Event Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 text-foreground-secondary">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium">
              {format(eventDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-foreground-secondary">
            <Clock className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium">
              {format(eventDate, 'h:mm a')}
            </span>
          </div>

          <div className="flex items-start gap-3 text-foreground-secondary">
            <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium leading-relaxed">
              {event.venue_address}
            </span>
          </div>
        </div>

        {/* Dance Styles */}
        {event.dance_styles && event.dance_styles.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {event.dance_styles.slice(0, 3).map((style) => (
                <span
                  key={style}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-all hover:scale-105 ${
                    DANCE_STYLE_COLORS[style.toLowerCase()] || 
                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {style}
                </span>
              ))}
              {event.dance_styles.length > 3 && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-background-tertiary text-foreground-secondary border border-border">
                  +{event.dance_styles.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-foreground-secondary text-sm leading-relaxed line-clamp-2 mb-4">
            {event.description}
          </p>
        )}

        {/* Attendee count */}
        {totalAttendees > 0 && (
          <div className="flex items-center gap-2 text-foreground-tertiary mb-4">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {totalAttendees} {totalAttendees === 1 ? 'person' : 'people'} interested
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter align="between" className="px-6 pb-6">
        {/* Action buttons */}
        <div className="flex gap-2">
          {isUpcoming && (
            <>
              <Button
                variant={currentStatus === 'going' ? 'success' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(currentStatus === 'going' ? null : 'going')}
                isLoading={isUpdating}
                leftIcon={<Check className="w-4 h-4" />}
                className="flex-1"
              >
                {currentStatus === 'going' ? 'Going' : 'Going?'}
              </Button>
              
              <Button
                variant={currentStatus === 'interested' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleStatusChange(currentStatus === 'interested' ? null : 'interested')}
                isLoading={isUpdating}
                leftIcon={<Heart className="w-4 h-4" />}
                className="flex-1"
              >
                {currentStatus === 'interested' ? 'Interested' : 'Interested?'}
              </Button>
            </>
          )}
        </div>

        {/* View details button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/events/${event.id}`)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="ml-2"
        >
          Details
        </Button>
      </CardFooter>
    </Card>
  )
})

EventCard.displayName = 'EventCard'

export default EventCard