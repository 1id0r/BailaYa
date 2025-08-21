'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Heart, Check } from 'lucide-react'
import { Event, CheckinStatus } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface EventCardProps {
  event: Event
  checkinStatus: CheckinStatus
  onStatusChange?: (eventId: string, status: CheckinStatus) => void
}

export default function EventCard({ event, checkinStatus, onStatusChange }: EventCardProps) {
  const { user } = useAuth()
  const [currentStatus, setCurrentStatus] = useState<CheckinStatus>(checkinStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: 'going' | 'interested') => {
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

  const eventDateTime = new Date(event.date_time)
  const formattedDate = format(eventDateTime, 'MMM dd, yyyy')
  const formattedTime = format(eventDateTime, 'h:mm a')

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 mx-4 sm:mx-0">
      {event.image_url && (
        <div className="relative h-48 sm:h-56">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>
        
        {event.description && (
          <p className="text-gray-600 mb-4 line-clamp-3 text-sm sm:text-base">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-sm sm:text-base">{formattedDate}</span>
          </div>
          
          <div className="flex items-center text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-sm sm:text-base">{formattedTime}</span>
          </div>
          
          <div className="flex items-center text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-medium">{event.venue_name}</span>
              <span className="text-xs sm:text-sm text-gray-500">{event.venue_address}</span>
            </div>
          </div>
        </div>
        
        {user && (
          <div className="flex gap-3">
            <button
              onClick={() => handleStatusChange('going')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                currentStatus === 'going'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Check className="w-4 h-4" />
              <span className="text-sm sm:text-base">Going</span>
            </button>
            
            <button
              onClick={() => handleStatusChange('interested')}
              disabled={isUpdating}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                currentStatus === 'interested'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className="w-4 h-4" />
              <span className="text-sm sm:text-base">Interested</span>
            </button>
          </div>
        )}
        
        {!user && (
          <div className="text-center py-3">
            <p className="text-gray-500 text-sm">Sign in to check-in to events</p>
          </div>
        )}
      </div>
    </div>
  )
}