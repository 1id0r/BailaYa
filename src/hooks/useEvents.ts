import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Event, EventCheckin, CheckinStatus } from '@/lib/types'

export interface EventWithCheckinStatus extends Event {
  checkinStatus: CheckinStatus
  checkinCount: {
    going: number
    interested: number
  }
}

export interface CheckinMutationData {
  eventId: string
  status: 'going' | 'interested'
}

export function useEvents() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const eventsQuery = useQuery({
    queryKey: ['events', user?.id],
    queryFn: async (): Promise<EventWithCheckinStatus[]> => {
      // Use Promise.all to fetch all data in parallel for better performance
      const promises = [
        // Fetch events
        supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('date_time', { ascending: true }),
        
        // Fetch user's check-ins if authenticated (parallel)
        user ? supabase
          .from('event_checkins')
          .select('*')
          .eq('user_id', user.id)
        : Promise.resolve({ data: [], error: null }),
        
        // Fetch checkin counts for all events (parallel)
        supabase
          .from('event_checkins')
          .select('event_id, status')
      ]

      const [eventsResult, userCheckinsResult, checkinCountsResult] = await Promise.all(promises)
      
      if (eventsResult.error) {
        console.error('Events error:', eventsResult.error)
        throw eventsResult.error
      }
      
      if (userCheckinsResult.error) {
        console.error('User checkins error:', userCheckinsResult.error)
        throw userCheckinsResult.error
      }
      
      if (checkinCountsResult.error) {
        console.error('Checkin counts error:', checkinCountsResult.error)
        throw checkinCountsResult.error
      }

      const events = eventsResult.data || []
      const userCheckins = userCheckinsResult.data || []
      const checkinCounts = checkinCountsResult.data || []

      // Create checkin status map with better performance
      const userCheckinMap = new Map<string, CheckinStatus>()
      userCheckins.forEach(checkin => {
        userCheckinMap.set(checkin.event_id, checkin.status)
      })

      // Create checkin counts map with improved logic
      const checkinCountsMap = new Map<string, { going: number; interested: number }>()
      
      // Initialize all events with zero counts first
      events.forEach(event => {
        checkinCountsMap.set(event.id, { going: 0, interested: 0 })
      })
      
      // Then populate with actual counts
      checkinCounts.forEach(checkin => {
        const counts = checkinCountsMap.get(checkin.event_id)
        if (counts) {
          if (checkin.status === 'going') counts.going++
          else if (checkin.status === 'interested') counts.interested++
        }
      })

      // Combine data
      return events.map(event => ({
        ...event,
        checkinStatus: userCheckinMap.get(event.id) || null,
        checkinCount: checkinCountsMap.get(event.id) || { going: 0, interested: 0 }
      }))
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes - events don't change that often
    cacheTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  })

  const toggleCheckinMutation = useMutation({
    mutationFn: async ({ eventId, status }: CheckinMutationData) => {
      if (!user) throw new Error('User must be authenticated')

      // Check if user already has a checkin for this event
      const { data: existingCheckin } = await supabase
        .from('event_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single()

      if (existingCheckin) {
        // If same status, remove checkin
        if (existingCheckin.status === status) {
          const { error } = await supabase
            .from('event_checkins')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', eventId)

          if (error) throw error
          return { action: 'removed', status: null }
        } else {
          // Update to new status
          const { error } = await supabase
            .from('event_checkins')
            .update({ status })
            .eq('user_id', user.id)
            .eq('event_id', eventId)

          if (error) throw error
          return { action: 'updated', status }
        }
      } else {
        // Create new checkin
        const { error } = await supabase
          .from('event_checkins')
          .insert({
            user_id: user.id,
            event_id: eventId,
            status,
          })

        if (error) throw error
        return { action: 'created', status }
      }
    },
    onSuccess: (result, variables) => {
      // Update the events query cache
      queryClient.setQueryData<EventWithCheckinStatus[]>(['events', user?.id], (oldData) => {
        if (!oldData) return oldData

        return oldData.map(event => {
          if (event.id === variables.eventId) {
            const updatedEvent = { ...event }
            
            // Update user's checkin status
            const oldStatus = updatedEvent.checkinStatus
            const newStatus = result.status
            updatedEvent.checkinStatus = newStatus

            // Update counts
            if (oldStatus === 'going') updatedEvent.checkinCount.going--
            if (oldStatus === 'interested') updatedEvent.checkinCount.interested--
            if (newStatus === 'going') updatedEvent.checkinCount.going++
            if (newStatus === 'interested') updatedEvent.checkinCount.interested++

            return updatedEvent
          }
          return event
        })
      })

      // Also invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['userCheckins'] })
    },
  })

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,
    toggleCheckin: toggleCheckinMutation.mutate,
    isToggling: toggleCheckinMutation.isPending,
  }
}

export function useUserCheckins() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['userCheckins', user?.id],
    queryFn: async (): Promise<EventCheckin[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('event_checkins')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', user.id)
        .order('checked_in_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

export function useUpcomingUserEvents() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['upcomingUserEvents', user?.id],
    queryFn: async (): Promise<EventWithCheckinStatus[]> => {
      if (!user) return []

      // Use a single join query for better performance
      const { data: results, error } = await supabase
        .from('event_checkins')
        .select(`
          status,
          event:events!inner(
            id,
            title,
            description,
            date_time,
            venue_name,
            venue_address,
            dance_styles,
            entry_price,
            organizer_name,
            organizer_contact,
            image_url,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .gte('event.date_time', new Date().toISOString())
        .eq('event.is_active', true)
        .order('event.date_time', { ascending: true })

      if (error) throw error

      // Transform the joined data
      return (results || []).map(result => ({
        ...result.event,
        checkinStatus: result.status,
        checkinCount: { going: 0, interested: 0 }
      }))
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}