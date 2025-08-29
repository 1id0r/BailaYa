import { useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { UserProfile } from '@/lib/types'

export interface UserWithFriendStatus extends UserProfile {
  friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends'
  friendRequestId?: string
}

export const useUserSearch = () => {
  const { user } = useAuth()
  const [searchResults, setSearchResults] = useState<UserWithFriendStatus[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentQuery, setCurrentQuery] = useState('')
  const [isPerformingAction, setIsPerformingAction] = useState(false)
  const userRef = useRef(user)
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, UserWithFriendStatus[]>>(new Map())

  // Update ref when user changes
  userRef.current = user

  const searchUsers = useCallback(async (query: string) => {
    const currentUser = userRef.current
    const trimmedQuery = query.trim().toLowerCase()
    
    if (!currentUser || trimmedQuery.length < 2) {
      setSearchResults([])
      setCurrentQuery('')
      return
    }

    // Prevent duplicate searches for the same query
    if (currentQuery === trimmedQuery) {
      return
    }

    // Check cache first
    if (cacheRef.current.has(trimmedQuery)) {
      const cachedResults = cacheRef.current.get(trimmedQuery)!
      setSearchResults(cachedResults)
      setCurrentQuery(trimmedQuery)
      return
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    setIsSearching(true)
    setCurrentQuery(trimmedQuery)

    try {
      // Search for users by name or email (select only needed fields)
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, location, dance_preferences, avatar_url')
        .neq('id', currentUser.id) // Exclude current user
        .or(`full_name.ilike.%${trimmedQuery}%,email.ilike.%${trimmedQuery}%`)
        .limit(15) // Reduced limit for better performance
        .abortSignal(abortControllerRef.current.signal)

      if (error) throw error

      // Get friend requests and friendships for these users
      const userIds = users.map(u => u.id)
      
      const [friendRequestsResult, friendshipsResult] = await Promise.all([
        supabase
          .from('friend_requests')
          .select('*')
          .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .in('requester_id', [currentUser.id, ...userIds])
          .in('receiver_id', [currentUser.id, ...userIds]),
        supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)
          .or(`user_id.in.(${userIds.join(',')}),friend_id.in.(${userIds.join(',')})`)
      ])

      if (friendRequestsResult.error) throw friendRequestsResult.error
      if (friendshipsResult.error) throw friendshipsResult.error

      // Create map of friend statuses
      const friendRequests = friendRequestsResult.data || []
      const friendships = friendshipsResult.data || []

      const usersWithStatus = users.map(profile => {
        // Check if they're already friends
        const friendship = friendships.find(f => 
          (f.user_id === currentUser.id && f.friend_id === profile.id) ||
          (f.user_id === profile.id && f.friend_id === currentUser.id)
        )
        
        if (friendship) {
          return { ...profile, friendStatus: 'friends' }
        }

        // Check for pending friend requests
        const sentRequest = friendRequests.find(fr => 
          fr.requester_id === currentUser.id && fr.receiver_id === profile.id && fr.status === 'pending'
        )
        
        if (sentRequest) {
          return { 
            ...profile, 
            friendStatus: 'pending_sent',
            friendRequestId: sentRequest.id
          }
        }

        const receivedRequest = friendRequests.find(fr => 
          fr.requester_id === profile.id && fr.receiver_id === currentUser.id && fr.status === 'pending'
        )
        
        if (receivedRequest) {
          return { 
            ...profile, 
            friendStatus: 'pending_received',
            friendRequestId: receivedRequest.id
          }
        }

        return { ...profile, friendStatus: 'none' }
      })

      setSearchResults(usersWithStatus as unknown as UserWithFriendStatus[])
      
      // Cache the results
      cacheRef.current.set(trimmedQuery, usersWithStatus as unknown as UserWithFriendStatus[])
      
      // Limit cache size to prevent memory leaks
      if (cacheRef.current.size > 10) {
        const firstKey = cacheRef.current.keys().next().value
        if (firstKey !== undefined) {
          cacheRef.current.delete(firstKey)
        }
      }
    } catch (error: unknown) {
      // Don't log abort errors
      if (error && typeof error === 'object' && 'name' in error && error.name !== 'AbortError') {
        console.error('Error searching users:', error)
        setSearchResults([])
      }
    } finally {
      setIsSearching(false)
      abortControllerRef.current = null
    }
  }, [currentQuery])

  const sendFriendRequest = useCallback(async (receiverId: string) => {
    const currentUser = userRef.current
    if (!currentUser || isPerformingAction) return

    setIsPerformingAction(true)
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: currentUser.id,
          receiver_id: receiverId,
        })

      if (error) throw error

      // Update the search results to reflect the new status
      setSearchResults(prev => 
        prev.map(user => 
          user.id === receiverId 
            ? { ...user, friendStatus: 'pending_sent' as const }
            : user
        )
      )
    } catch (error) {
      console.error('Error sending friend request:', error)
    } finally {
      setIsPerformingAction(false)
    }
  }, [isPerformingAction])

  const acceptFriendRequest = useCallback(async (requestId: string, requesterId: string) => {
    const currentUser = userRef.current
    if (!currentUser || isPerformingAction) return

    setIsPerformingAction(true)
    try {
      // Start a transaction-like operation
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Create friendship records for both users
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert([
          { user_id: currentUser.id, friend_id: requesterId },
          { user_id: requesterId, friend_id: currentUser.id }
        ])

      if (friendshipError) throw friendshipError

      // Update the search results to reflect the new status
      setSearchResults(prev => 
        prev.map(u => 
          u.id === requesterId 
            ? { ...u, friendStatus: 'friends' as const, friendRequestId: undefined }
            : u
        )
      )
    } catch (error) {
      console.error('Error accepting friend request:', error)
    } finally {
      setIsPerformingAction(false)
    }
  }, [isPerformingAction])

  const declineFriendRequest = useCallback(async (requestId: string, requesterId: string) => {
    if (!userRef.current || isPerformingAction) return

    setIsPerformingAction(true)
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)

      if (error) throw error

      // Update the search results to reflect the new status
      setSearchResults(prev => 
        prev.map(u => 
          u.id === requesterId 
            ? { ...u, friendStatus: 'none' as const, friendRequestId: undefined }
            : u
        )
      )
    } catch (error) {
      console.error('Error declining friend request:', error)
    } finally {
      setIsPerformingAction(false)
    }
  }, [isPerformingAction])

  // Clear cache when user changes
  useMemo(() => {
    if (user?.id) {
      cacheRef.current.clear()
    }
  }, [user])

  return {
    searchResults,
    isSearching,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    isPerformingAction,
  }
}