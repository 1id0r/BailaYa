'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Calendar, 
  MapPin, 
  Heart, 
  Check, 
  Users, 
  Share2, 
  DollarSign, 
  ArrowLeft, 
  Copy,
  User,
  Phone,
  Mail
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Event, EventCheckin, UserProfile } from '@/lib/types'
import { LoadingGrid } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

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

interface EventWithAttendees extends Event {
  attendees: {
    going: (EventCheckin & { user: UserProfile })[]
    interested: (EventCheckin & { user: UserProfile })[]
  }
  userCheckin: EventCheckin | null
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [event, setEvent] = useState<EventWithAttendees | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const eventId = params.id as string

  useEffect(() => {
    if (eventId) {
      fetchEventDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user])

  const fetchEventDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError

      // Fetch all checkins for this event
      const { data: checkins, error: checkinsError } = await supabase
        .from('event_checkins')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('event_id', eventId)

      if (checkinsError) throw checkinsError

      // Separate going and interested attendees
      const going = checkins?.filter(c => c.status === 'going') || []
      const interested = checkins?.filter(c => c.status === 'interested') || []

      // Find current user's checkin
      const userCheckin = user ? checkins?.find(c => c.user_id === user.id) || null : null

      setEvent({
        ...eventData,
        attendees: { going, interested },
        userCheckin
      })
    } catch (err) {
      console.error('Error fetching event details:', err)
      setError('Failed to load event details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'going' | 'interested') => {
    if (!user || isUpdating || !event) return

    setIsUpdating(true)
    
    try {
      const currentStatus = event.userCheckin?.status

      if (currentStatus === newStatus) {
        // Remove checkin
        const { error } = await supabase
          .from('event_checkins')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId)

        if (!error) {
          await fetchEventDetails() // Refresh data
        }
      } else {
        // Update or create checkin
        const { error } = await supabase
          .from('event_checkins')
          .upsert({
            user_id: user.id,
            event_id: eventId,
            status: newStatus,
          })

        if (!error) {
          await fetchEventDetails() // Refresh data
        }
      }
    } catch (error) {
      console.error('Error updating check-in status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: `Check out this ${event?.dance_styles?.join(', ')} event at ${event?.venue_name}!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
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

  const copyAddress = async () => {
    if (event?.venue_address) {
      try {
        await navigator.clipboard.writeText(event.venue_address)
        showToast({
          type: 'success',
          title: 'Address copied!',
          message: 'Venue address copied to clipboard'
        })
      } catch (error) {
        console.log('Error copying address:', error)
        showToast({
          type: 'error',
          title: 'Copy failed',
          message: 'Unable to copy address to clipboard'
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingGrid count={1} />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorMessage
            title="Event not found"
            message="The event you're looking for doesn't exist or has been removed."
            onRetry={() => router.push('/events')}
          />
        </div>
      </div>
    )
  }

  const eventDateTime = new Date(event.date_time)
  const formattedDate = format(eventDateTime, 'EEEE, MMMM dd, yyyy')
  const formattedTime = format(eventDateTime, 'h:mm a')
  const totalAttendees = event.attendees.going.length + event.attendees.interested.length

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 flex-1 truncate">Event Details</h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Hero Image */}
        {event.image_url && (
          <div className="relative h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden mt-6 mb-6">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Overlay content */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {event.dance_styles?.map((style, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      DANCE_STYLE_COLORS[style.toLowerCase()] || 'bg-white/90 text-gray-800'
                    } bg-opacity-90 backdrop-blur-sm`}
                  >
                    {style}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 line-clamp-2">
                {event.title}
              </h1>
              {totalAttendees > 0 && (
                <div className="flex items-center gap-1 text-white/90">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{totalAttendees} people interested</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Title and Dance Styles (if no image) */}
        {!event.image_url && (
          <div className="mt-6 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>
            {event.dance_styles && event.dance_styles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.dance_styles.map((style, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      DANCE_STYLE_COLORS[style.toLowerCase()] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {style}
                  </span>
                ))}
              </div>
            )}
            {totalAttendees > 0 && (
              <div className="flex items-center gap-1 text-gray-600 mb-4">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{totalAttendees} people interested</span>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{formattedDate}</p>
                    <p className="text-gray-600">{formattedTime}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.venue_name}</p>
                    <p className="text-gray-600 mb-2">{event.venue_address}</p>
                    <button
                      onClick={copyAddress}
                      className="inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Address
                    </button>
                  </div>
                </div>

                {event.entry_price !== null && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {event.entry_price === 0 ? 'Free Entry' : `$${event.entry_price}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Organizer Info */}
            {(event.organizer_name || event.organizer_contact) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizer</h2>
                <div className="space-y-2">
                  {event.organizer_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{event.organizer_name}</span>
                    </div>
                  )}
                  {event.organizer_contact && (
                    <div className="flex items-center gap-2">
                      {event.organizer_contact.includes('@') ? (
                        <Mail className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Phone className="w-4 h-4 text-gray-500" />
                      )}
                      <a
                        href={event.organizer_contact.includes('@') 
                          ? `mailto:${event.organizer_contact}`
                          : `tel:${event.organizer_contact}`
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {event.organizer_contact}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            {user && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Join This Event</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusChange('going')}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                      event.userCheckin?.status === 'going'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Check className="w-4 h-4" />
                    {event.userCheckin?.status === 'going' ? "You're going!" : 'Going'}
                  </button>
                  
                  <button
                    onClick={() => handleStatusChange('interested')}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                      event.userCheckin?.status === 'interested'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart className="w-4 h-4" />
                    {event.userCheckin?.status === 'interested' ? "You're interested!" : 'Interested'}
                  </button>
                </div>
              </div>
            )}

            {/* Attendance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h3>
              
              <div className="space-y-4">
                {event.attendees.going.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">
                        Going ({event.attendees.going.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {event.attendees.going.slice(0, 5).map((checkin) => (
                        <div key={checkin.id} className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700 truncate">
                            {checkin.user?.full_name || 'Anonymous'}
                          </span>
                        </div>
                      ))}
                      {event.attendees.going.length > 5 && (
                        <p className="text-sm text-gray-500 pl-8">
                          +{event.attendees.going.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {event.attendees.interested.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-4 h-4 text-pink-600" />
                      <span className="font-medium text-gray-900">
                        Interested ({event.attendees.interested.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {event.attendees.interested.slice(0, 5).map((checkin) => (
                        <div key={checkin.id} className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-pink-600" />
                          </div>
                          <span className="text-sm text-gray-700 truncate">
                            {checkin.user?.full_name || 'Anonymous'}
                          </span>
                        </div>
                      ))}
                      {event.attendees.interested.length > 5 && (
                        <p className="text-sm text-gray-500 pl-8">
                          +{event.attendees.interested.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {totalAttendees === 0 && (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No one has joined yet</p>
                    <p className="text-gray-400 text-xs">Be the first to join!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}