'use client'

import { useState, useMemo } from 'react'
import { Search, Calendar, X, SlidersHorizontal } from 'lucide-react'
import EventCard from '@/components/EventCard'
import { useEvents } from '@/hooks/useEvents'
import { LoadingGrid } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

const DANCE_STYLES = [
  { value: 'salsa', label: 'Salsa', color: 'bg-red-100 text-red-800' },
  { value: 'bachata', label: 'Bachata', color: 'bg-pink-100 text-pink-800' },
  { value: 'merengue', label: 'Merengue', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'reggaeton', label: 'Reggaeton', color: 'bg-green-100 text-green-800' },
  { value: 'kizomba', label: 'Kizomba', color: 'bg-purple-100 text-purple-800' },
  { value: 'zouk', label: 'Zouk', color: 'bg-blue-100 text-blue-800' },
  { value: 'chacha', label: 'Cha-cha', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'cumbia', label: 'Cumbia', color: 'bg-orange-100 text-orange-800' },
]

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'alphabetical', label: 'A-Z' },
]

type SortOption = 'date' | 'popularity' | 'alphabetical'
type DateFilter = 'all' | 'today' | 'week' | 'month'

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDanceStyles, setSelectedDanceStyles] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [showFilters, setShowFilters] = useState(false)
  const { events, isLoading, error, refetch, toggleCheckin } = useEvents()

  const filteredAndSortedEvents = useMemo(() => {
    const filtered = events.filter(event => {
      // Text search
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Dance style filter
      const matchesDanceStyle = selectedDanceStyles.length === 0 || 
        selectedDanceStyles.some(style => 
          event.dance_styles?.some(eventStyle => 
            eventStyle.toLowerCase() === style.toLowerCase()
          )
        )
      
      // Date filter
      const eventDate = new Date(event.date_time)
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      
      let matchesDate = true
      switch (dateFilter) {
        case 'today':
          matchesDate = eventDate >= startOfToday && eventDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
          break
        case 'week':
          matchesDate = eventDate >= startOfWeek
          break
        case 'month':
          matchesDate = eventDate >= startOfMonth
          break
        case 'all':
        default:
          matchesDate = true
      }
      
      return matchesSearch && matchesDanceStyle && matchesDate
    })

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          const aTotal = (a.checkinCount?.going || 0) + (a.checkinCount?.interested || 0)
          const bTotal = (b.checkinCount?.going || 0) + (b.checkinCount?.interested || 0)
          return bTotal - aTotal
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        case 'date':
        default:
          return new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
      }
    })

    return filtered
  }, [events, searchTerm, selectedDanceStyles, dateFilter, sortBy])

  const upcomingEvents = filteredAndSortedEvents.filter(event => new Date(event.date_time) >= new Date())
  const pastEvents = filteredAndSortedEvents.filter(event => new Date(event.date_time) < new Date())

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDanceStyles([])
    setDateFilter('all')
    setSortBy('date')
  }

  const hasActiveFilters = searchTerm !== '' || selectedDanceStyles.length > 0 || dateFilter !== 'all' || sortBy !== 'date'

  const toggleDanceStyle = (style: string) => {
    setSelectedDanceStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Dance Events
            </h1>
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${
                hasActiveFilters || showFilters
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {showFilters && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 space-y-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</label>
                <div className="flex gap-2 flex-wrap">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortOption)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        sortBy === option.value
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <div className="flex gap-2 flex-wrap">
                  {DATE_FILTERS.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setDateFilter(filter.value as DateFilter)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        dateFilter === filter.value
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dance Styles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dance Styles</label>
                <div className="flex gap-2 flex-wrap">
                  {DANCE_STYLES.map(style => (
                    <button
                      key={style.value}
                      onClick={() => toggleDanceStyle(style.value)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedDanceStyles.includes(style.value)
                          ? style.color
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-8">
        {upcomingEvents.length > 0 && (
          <section className="mb-8">
            <div className="px-4 py-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
              <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-4">
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

        {filteredAndSortedEvents.length === 0 && (
          <div className="text-center py-16 px-4">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No events found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms' 
                : 'Check back later for new events'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}