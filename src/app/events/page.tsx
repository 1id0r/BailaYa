'use client'

import { useState } from 'react'
import { Search, Calendar } from 'lucide-react'
import EventCard from '@/components/EventCard'
import { useEvents } from '@/hooks/useEvents'
import { LoadingGrid } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { events, isLoading, error, refetch, toggleCheckin } = useEvents()

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const upcomingEvents = filteredEvents.filter(event => new Date(event.date_time) >= new Date())
  const pastEvents = filteredEvents.filter(event => new Date(event.date_time) < new Date())

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dance Events
              </h1>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, venues..."
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto pb-8 pt-6">
          <LoadingGrid count={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dance Events
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <ErrorMessage
            title="Unable to load events"
            message="We couldn't fetch the latest events. Please check your connection and try again."
            onRetry={refetch}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dance Events
            </h1>
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events, venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-8">
        {upcomingEvents.length > 0 && (
          <section className="mb-8">
            <div className="px-4 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    checkinStatus={event.checkinStatus}
                    onStatusChange={(eventId, status) => {
                      if (status === 'going' || status === 'interested') {
                        toggleCheckin({ eventId, status })
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {pastEvents.length > 0 && (
          <section>
            <div className="px-4 py-6">
              <h2 className="text-xl font-semibold text-gray-500 mb-4">
                Past Events
              </h2>
              <div className="space-y-4 opacity-75">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    checkinStatus={event.checkinStatus}
                    onStatusChange={(eventId, status) => {
                      if (status === 'going' || status === 'interested') {
                        toggleCheckin({ eventId, status })
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new events'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}