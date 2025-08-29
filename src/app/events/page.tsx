'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, X } from 'lucide-react'
import EventCard from '@/components/EventCard'
import { useEvents } from '@/hooks/useEvents'
import { LoadingGrid } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const DANCE_STYLES = [
  { value: 'salsa', label: 'Salsa', color: 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' },
  { value: 'bachata', label: 'Bachata', color: 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800' },
  { value: 'merengue', label: 'Merengue', color: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' },
  { value: 'reggaeton', label: 'Reggaeton', color: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' },
  { value: 'kizomba', label: 'Kizomba', color: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' },
  { value: 'zouk', label: 'Zouk', color: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' },
  { value: 'chacha', label: 'Cha-cha', color: 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' },
  { value: 'cumbia', label: 'Cumbia', color: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800' },
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
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get('search') || ''
  const showFilters = searchParams.get('filters') === 'true'
  const [selectedDanceStyles, setSelectedDanceStyles] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date')
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
    // Clear URL params
    window.history.pushState({}, '', `/events`)
    // Clear local state
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
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <LoadingGrid count={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {showFilters && (
            <div className="glass border border-glass-border rounded-2xl p-6 mb-6 space-y-6 animate-slide-down">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Sort by</label>
                <div className="flex gap-2 flex-wrap">
                  {SORT_OPTIONS.map(option => (
                    <Button
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortOption)}
                      variant={sortBy === option.value ? 'primary' : 'ghost'}
                      size="sm"
                      className="rounded-full"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Date</label>
                <div className="flex gap-2 flex-wrap">
                  {DATE_FILTERS.map(filter => (
                    <Button
                      key={filter.value}
                      onClick={() => setDateFilter(filter.value as DateFilter)}
                      variant={dateFilter === filter.value ? 'secondary' : 'ghost'}
                      size="sm"
                      className="rounded-full"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Dance Styles */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Dance Styles</label>
                <div className="flex gap-2 flex-wrap">
                  {DANCE_STYLES.map(style => (
                    <button
                      key={style.value}
                      onClick={() => toggleDanceStyle(style.value)}
                      className={`px-3 py-2 text-xs font-medium rounded-full border transition-all hover:scale-105 ${
                        selectedDanceStyles.includes(style.value)
                          ? style.color
                          : 'bg-background-tertiary text-foreground-secondary border-border hover:bg-background-elevated'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="pt-4 border-t border-glass-border">
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    size="sm"
                    leftIcon={<X className="w-4 h-4" />}
                    className="text-foreground-tertiary hover:text-foreground"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        {upcomingEvents.length > 0 && (
          <section className="mb-12">
            <div className="px-4 py-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Upcoming Events
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
              </div>
              <div className="space-y-6">
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-foreground-muted rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground-muted">
                  Past Events
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
              </div>
              <div className="space-y-6 opacity-75">
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
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 bg-gradient-to-r from-foreground-muted/20 to-foreground-muted/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-foreground-muted" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              No events found
            </h3>
            <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms to discover more amazing dance events' 
                : 'Check back later for new events or explore our community'
              }
            </p>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="primary"
                leftIcon={<X className="w-4 h-4" />}
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}