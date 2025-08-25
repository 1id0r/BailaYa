'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Heart, Check, Users, Share2, DollarSign } from 'lucide-react'
import { Event, CheckinStatus } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

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

const DANCE_STYLE_COLORS: Record<string, string> = {
  'salsa': 'bg-red-100 text-red-800',
  'bachata': 'bg-pink-100 text-pink-800', 
  'merengue': 'bg-yellow-100 text-yellow-800',
  'reggaeton': 'bg-green-100 text-green-800',
  'kizomba': 'bg-purple-100 text-purple-800',
  'zouk': 'bg-blue-100 text-blue-800',
  'chacha': 'bg-indigo-100 text-indigo-800',
  'cha-cha': 'bg-indigo-100 text-indigo-800',
  'cumbia': 'bg-orange-100 text-orange-800',
}

export default function EventCard({ event, checkinStatus, onStatusChange }: EventCardProps) {
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
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`)
        showToast({
          type: 'success',
          title: 'Link copied!',
          message: 'Event link copied to clipboard'
        })
      } catch (error) {
        console.log('Error copying to clipboard:', error)
        showToast({
          type: 'error',
          title: 'Copy failed',
          message: 'Unable to copy link to clipboard'
        })
      }
    }
  }

  const handleStatusChange = async (newStatus: 'going' | 'interested', e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent navigation when clicking buttons
    if (!user || isUpdating) return

    setIsUpdating(true)
    
    try {
      if (currentStatus === newStatus) {
        const { error } = await supabase
          .from('event_checkins')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id)

        if (!error) {
          setCurrentStatus(null)
          onStatusChange?.(event.id, null)
        }
      } else {
        const { error } = await supabase
          .from('event_checkins')
          .upsert({
            user_id: user.id,
            event_id: event.id,
            status: newStatus,
          })

        if (!error) {
          setCurrentStatus(newStatus)
          onStatusChange?.(event.id, newStatus)
        }
      }
    } catch (error) {
      console.error('Error updating check-in status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCardClick = () => {
    router.push(`/events/${event.id}`)
  }

  const eventDateTime = new Date(event.date_time)
  const formattedDate = format(eventDateTime, 'MMM dd, yyyy')
  const formattedTime = format(eventDateTime, 'h:mm a')

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden mb-4 mx-4 sm:mx-0 cursor-pointer"
    >
      {event.image_url && (
        <div className="relative h-48 sm:h-56">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Share button overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleShare()
            }}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-sm transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Dance style badges overlay */}
          {event.dance_styles && event.dance_styles.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
              {event.dance_styles.slice(0, 3).map((style, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    DANCE_STYLE_COLORS[style.toLowerCase()] || 'bg-gray-100 text-gray-800'
                  } bg-opacity-90 backdrop-blur-sm`}
                >
                  {style}
                </span>
              ))}
              {event.dance_styles.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 bg-opacity-90 backdrop-blur-sm">
                  +{event.dance_styles.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        {/* Header with title and attendance */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1 line-clamp-2 pr-2">
            {event.title}
          </h3>
          
          {/* Attendance count */}
          {event.checkinCount && (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 min-w-fit">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                {(event.checkinCount.going || 0) + (event.checkinCount.interested || 0)}
              </span>
            </div>
          )}
        </div>
        
        {/* Dance styles - show if no image */}
        {!event.image_url && event.dance_styles && event.dance_styles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.dance_styles.slice(0, 4).map((style, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  DANCE_STYLE_COLORS[style.toLowerCase()] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {style}
              </span>
            ))}
            {event.dance_styles.length > 4 && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                +{event.dance_styles.length - 4}
              </span>
            )}
          </div>
        )}
        
        {event.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 text-sm sm:text-base">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
            <span className="text-sm sm:text-base">{formattedDate}</span>
          </div>
          
          <div className="flex items-center text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
            <span className="text-sm sm:text-base">{formattedTime}</span>
          </div>
          
          <div className="flex items-center text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-medium truncate">{event.venue_name}</span>
              <span className="text-xs sm:text-sm text-gray-500 truncate">{event.venue_address}</span>
            </div>
          </div>

          {event.entry_price !== null && (
            <div className="flex items-center text-gray-700">
              <DollarSign className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium">
                {event.entry_price === 0 ? 'Free' : `$${event.entry_price}`}
              </span>
            </div>
          )}
        </div>

        {/* Detailed attendance breakdown */}
        {event.checkinCount && (event.checkinCount.going > 0 || event.checkinCount.interested > 0) && (
          <div className="flex items-center gap-4 mb-4 text-sm">
            {event.checkinCount.going > 0 && (
              <div className="flex items-center gap-1 text-green-700">
                <Check className="w-3 h-3" />
                <span>{event.checkinCount.going} going</span>
              </div>
            )}
            {event.checkinCount.interested > 0 && (
              <div className="flex items-center gap-1 text-pink-700">
                <Heart className="w-3 h-3" />
                <span>{event.checkinCount.interested} interested</span>
              </div>
            )}
          </div>
        )}
        
        {user && (
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={(e) => handleStatusChange('going', e)}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all ${
                currentStatus === 'going'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm sm:text-base truncate">Going</span>
            </button>
            
            <button
              onClick={(e) => handleStatusChange('interested', e)}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all ${
                currentStatus === 'interested'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm sm:text-base truncate">Interested</span>
            </button>

            {/* Share button for mobile when no image */}
            {!event.image_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare()
                }}
                className="flex items-center justify-center p-2.5 sm:p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {!user && (
          <div className="text-center py-3">
            <p className="text-gray-500 text-sm">Sign in to check-in to events</p>
            {!event.image_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare()
                }}
                className="mt-2 inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
              >
                <Share2 className="w-4 h-4" />
                Share Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}