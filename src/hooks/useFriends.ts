import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Friendship, FriendRequest, UserProfile, EventWithCheckinStatus } from '@/lib/types'

export const useFriends = () => {
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

      // Get user's friends
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)

      if (friendsError) throw friendsError
      
      const friendIds = friendships?.map(f => f.friend_id) || []
      if (friendIds.length === 0) return []

      // Get friends' upcoming events
      const { data: friendCheckins, error: checkinsError } = await supabase
        .from('event_checkins')
        .select(`
          *,
          event:events(*),
          user:profiles(*)
        `)
        .in('user_id', friendIds)
        .gte('event.date_time', new Date().toISOString())

      if (checkinsError) throw checkinsError

      // Transform data
      const eventsMap = new Map<string, EventWithCheckinStatus>()
      
      friendCheckins?.forEach(checkin => {
        if (!checkin.event) return
        
        const eventId = checkin.event.id
        if (!eventsMap.has(eventId)) {
          eventsMap.set(eventId, {
            ...checkin.event,
            checkinStatus: null, // User hasn't checked in
            checkinCount: { going: 0, interested: 0 },
            friendsGoing: [],
            friendsInterested: [],
          })
        }
        
        const event = eventsMap.get(eventId)
        if (!event) return
        
        if (checkin.status === 'going') {
          event.friendsGoing?.push(checkin.user)
        } else {
          event.friendsInterested?.push(checkin.user)
        }
      })

      return Array.from(eventsMap.values()).sort((a, b) => 
        new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
      )
    },
    enabled: !!user,
  })
}