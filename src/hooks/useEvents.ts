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
      console.log('Fetching events...')
      
      // Fetch events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('date_time', { ascending: true })

      console.log('Events query result:', { events, error: eventsError })

      if (eventsError) {
        console.error('Events error:', eventsError)
        throw eventsError
      }

      // Fetch user's check-ins if authenticated
      let userCheckins: EventCheckin[] = []
      if (user) {
        const { data, error } = await supabase
          .from('event_checkins')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error
        userCheckins = data || []
      }

      // Fetch checkin counts for all events
      const { data: checkinCounts, error: countsError } = await supabase
        .from('event_checkins')
        .select('event_id, status')

      if (countsError) throw countsError

      // Create checkin status map
      const userCheckinMap = new Map<string, CheckinStatus>()
      userCheckins.forEach(checkin => {
        userCheckinMap.set(checkin.event_id, checkin.status)
      })

      // Create checkin counts map
      const checkinCountsMap = new Map<string, { going: number; interested: number }>()
      checkinCounts?.forEach(checkin => {
        if (!checkinCountsMap.has(checkin.event_id)) {
          checkinCountsMap.set(checkin.event_id, { going: 0, interested: 0 })
        }
        const counts = checkinCountsMap.get(checkin.event_id)!
        if (checkin.status === 'going') counts.going++
        else if (checkin.status === 'interested') counts.interested++
      })

      // Combine data
      return events.map(event => ({
        ...event,
        checkinStatus: userCheckinMap.get(event.id) || null,
        checkinCount: checkinCountsMap.get(event.id) || { going: 0, interested: 0 }
      }))
    },
    enabled: true,
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

      // First get the user's check-ins
      const { data: checkins, error: checkinsError } = await supabase
        .from('event_checkins')
        .select('*')
        .eq('user_id', user.id)

      if (checkinsError) throw checkinsError

      if (!checkins || checkins.length === 0) return []

      // Then get the events for those check-ins
      const eventIds = checkins.map(c => c.event_id)
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })

      if (eventsError) throw eventsError

      // Combine the data
      return (events || []).map(event => {
        const checkin = checkins.find(c => c.event_id === event.id)
        return {
          ...event,
          checkinStatus: checkin?.status || null,
          checkinCount: { going: 0, interested: 0 }
        }
      })
    },
    enabled: !!user,
  })
}