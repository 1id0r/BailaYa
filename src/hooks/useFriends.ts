import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Friendship, FriendRequest, UserProfile, EventWithCheckinStatus } from '@/lib/types'

export const useFriends = (): {
  friends: (Friendship & { friend: UserProfile })[]
  friendRequests: (FriendRequest & { requester: UserProfile })[]
  isLoading: boolean
  error: Error | null
  removeFriend: (friendshipId: string) => void
  isRemoving: boolean
  refetch: () => void
} => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const friendsQuery = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async (): Promise<(Friendship & { friend: UserProfile })[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:profiles!friendships_friend_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - friends don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  })

  const friendRequestsQuery = useQuery({
    queryKey: ['friendRequests', user?.id],
    queryFn: async (): Promise<(FriendRequest & { requester: UserProfile })[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          requester:profiles!friend_requests_requester_id_fkey(*)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute - friend requests need to be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 30 * 1000, // Check for new friend requests every 30 seconds
  })

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error('User not authenticated')

      // Remove both friendship records
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] })
    },
  })

  return {
    friends: friendsQuery.data || [],
    friendRequests: friendRequestsQuery.data || [],
    isLoading: friendsQuery.isLoading || friendRequestsQuery.isLoading,
    error: friendsQuery.error || friendRequestsQuery.error,
    removeFriend: removeFriendMutation.mutate,
    isRemoving: removeFriendMutation.isPending,
    refetch: () => {
      friendsQuery.refetch()
      friendRequestsQuery.refetch()
    },
  }
}

export const useFriendsEvents = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['friendsEvents', user?.id],
    queryFn: async (): Promise<EventWithCheckinStatus[]> => {
      if (!user) return []

      // First get friend IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        
      if (!friendships || friendships.length === 0) return []
      
      const friendIds = friendships.map(f => f.friend_id)

      // Then get their event checkins
      const { data: friendCheckins, error } = await supabase
        .from('event_checkins')
        .select(`
          status,
          user_id,
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
          ),
          user:profiles!inner(*)
        `)
        .in('user_id', friendIds)
        .gte('event.date_time', new Date().toISOString())
        .eq('event.is_active', true)

      if (error) throw error

      // Transform data
      const eventsMap = new Map<string, EventWithCheckinStatus>()
      
      friendCheckins?.forEach(checkin => {
        if (!checkin.event) return
        
        const eventId = (checkin.event as unknown as { id: string }).id
        if (!eventsMap.has(eventId)) {
          eventsMap.set(eventId, {
            ...(checkin.event as unknown as Event),
            checkinStatus: null, // User hasn't checked in
            checkinCount: { going: 0, interested: 0 },
            friendsGoing: [],
            friendsInterested: [],
          } as unknown as EventWithCheckinStatus)
        }
        
        const event = eventsMap.get(eventId)
        if (!event) return
        
        if (checkin.status === 'going') {
          event.friendsGoing?.push(checkin.user as unknown as UserProfile)
        } else {
          event.friendsInterested?.push(checkin.user as unknown as UserProfile)
        }
      })

      return Array.from(eventsMap.values()).sort((a, b) => 
        new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
      )
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}