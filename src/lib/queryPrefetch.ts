import { QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

// Global query client for prefetching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Prefetch events for better UX
export const prefetchEvents = async (userId?: string) => {
  return queryClient.prefetchQuery({
    queryKey: ['events', userId],
    queryFn: async () => {
      // Fetch events with optimized query
      const promises = [
        // Fetch events
        supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .order('date_time', { ascending: true }),
        
        // Fetch user's check-ins if authenticated
        userId ? supabase
          .from('event_checkins')
          .select('*')
          .eq('user_id', userId)
        : Promise.resolve({ data: [], error: null }),
        
        // Fetch checkin counts
        supabase
          .from('event_checkins')
          .select('event_id, status')
      ]

      const [eventsResult, userCheckinsResult, checkinCountsResult] = await Promise.all(promises)
      
      if (eventsResult.error) throw eventsResult.error
      if (userCheckinsResult.error) throw userCheckinsResult.error
      if (checkinCountsResult.error) throw checkinCountsResult.error

      const events = eventsResult.data || []
      const userCheckins = userCheckinsResult.data || []
      const checkinCounts = checkinCountsResult.data || []

      // Create maps for efficient lookup
      const userCheckinMap = new Map()
      userCheckins.forEach((checkin: any) => {
        userCheckinMap.set(checkin.event_id, checkin.status)
      })

      const checkinCountsMap = new Map()
      events.forEach((event: any) => {
        checkinCountsMap.set(event.id, { going: 0, interested: 0 })
      })
      
      checkinCounts.forEach((checkin: any) => {
        const counts = checkinCountsMap.get(checkin.event_id)
        if (counts) {
          if (checkin.status === 'going') counts.going++
          else if (checkin.status === 'interested') counts.interested++
        }
      })

      // Combine data
      return events.map((event: any) => ({
        ...event,
        checkinStatus: userCheckinMap.get(event.id) || null,
        checkinCount: checkinCountsMap.get(event.id) || { going: 0, interested: 0 }
      }))
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Prefetch user's upcoming events
export const prefetchUserEvents = async (userId: string) => {
  return queryClient.prefetchQuery({
    queryKey: ['upcomingUserEvents', userId],
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from('event_checkins')
        .select(`
          status,
          event:events!inner(*)
        `)
        .eq('user_id', userId)
        .gte('event.date_time', new Date().toISOString())
        .eq('event.is_active', true)
        .order('event.date_time', { ascending: true })

      if (error) throw error

      return (results || []).map((result: any) => ({
        ...result.event,
        checkinStatus: result.status,
        checkinCount: { going: 0, interested: 0 }
      }))
    },
    staleTime: 3 * 60 * 1000,
  })
}

// Prefetch friends data
export const prefetchFriendsData = async (userId: string) => {
  return Promise.all([
    // Prefetch friends
    queryClient.prefetchQuery({
      queryKey: ['friends', userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('friendships')
          .select(`
            *,
            friend:profiles!friendships_friend_id_fkey(*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      },
      staleTime: 5 * 60 * 1000,
    }),
    
    // Prefetch friend requests
    queryClient.prefetchQuery({
      queryKey: ['friendRequests', userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('friend_requests')
          .select(`
            *,
            requester:profiles!friend_requests_requester_id_fkey(*)
          `)
          .eq('receiver_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
      },
      staleTime: 1 * 60 * 1000,
    })
  ])
}

// Smart prefetching based on user behavior
export const smartPrefetch = async (userId?: string) => {
  if (!userId) {
    // Guest user - just prefetch public events
    return prefetchEvents()
  }

  // Authenticated user - prefetch all relevant data
  return Promise.all([
    prefetchEvents(userId),
    prefetchUserEvents(userId),
    prefetchFriendsData(userId),
  ])
}