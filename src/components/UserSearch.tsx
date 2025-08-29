'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Search, User, UserPlus, Check, Clock, X } from 'lucide-react'
import { useUserSearch, UserWithFriendStatus } from '@/hooks/useUserSearch'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'

const UserSearch = memo(() => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const {
    searchResults,
    isSearching,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    isPerformingAction,
  } = useUserSearch()

  // Improved debounced search with better cleanup
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastQueryRef = useRef('')
  
  const debouncedSearch = useCallback((query: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    const trimmedQuery = query.trim()
    
    // Don't search if query hasn't changed
    if (lastQueryRef.current === trimmedQuery) {
      return
    }
    
    if (trimmedQuery.length >= 2) {
      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        lastQueryRef.current = trimmedQuery
        searchUsers(trimmedQuery)
      }, 500) // Increased debounce time to reduce API calls
    } else if (trimmedQuery.length === 0) {
      // Clear results immediately if query is empty
      lastQueryRef.current = ''
      searchUsers('')
    }
  }, [searchUsers])
  
  useEffect(() => {
    debouncedSearch(searchQuery)

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery, debouncedSearch])

  const handleFriendAction = useCallback(async (
    action: 'send' | 'accept' | 'decline',
    userId: string,
    requestId?: string
  ) => {
    switch (action) {
      case 'send':
        await sendFriendRequest(userId)
        break
      case 'accept':
        if (requestId) await acceptFriendRequest(requestId, userId)
        break
      case 'decline':
        if (requestId) await declineFriendRequest(requestId, userId)
        break
    }
  }, [sendFriendRequest, acceptFriendRequest, declineFriendRequest])

  const getActionButton = useCallback((user: UserWithFriendStatus) => {
    switch (user.friendStatus) {
      case 'friends':
        return (
          <div className="flex items-center gap-2 text-success-600 dark:text-success-400 font-medium">
            <Check className="w-4 h-4" />
            <span className="text-sm">Friends</span>
          </div>
        )
      
      case 'pending_sent':
        return (
          <div className="flex items-center gap-2 text-warning-600 dark:text-warning-400 font-medium">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
        )
      
      case 'pending_received':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleFriendAction('accept', user.id, user.friendRequestId)}
              disabled={isPerformingAction}
              variant="success"
              size="sm"
              className="px-3"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => handleFriendAction('decline', user.id, user.friendRequestId)}
              disabled={isPerformingAction}
              variant="destructive"
              size="sm"
              className="px-3"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )
      
      default:
        return (
          <Button
            onClick={() => handleFriendAction('send', user.id)}
            disabled={isPerformingAction}
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-3 h-3" />}
          >
            Add Friend
          </Button>
        )
    }
  }, [handleFriendAction, isPerformingAction])

  if (!user) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <CardContent>
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Sign in to search for users</h3>
          <p className="text-foreground-secondary">Connect with fellow dancers in your area</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Modern Search Input */}
      <Input
        type="text"
        placeholder="Search for dancers by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
        variant="filled"
      />

      {/* Modern Loading State */}
      {isSearching && searchQuery.length >= 2 && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} variant="elevated" className="animate-pulse">
              <CardContent className="p-4 h-20">
                <div className="skeleton w-full h-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((searchUser) => (
            <Card
              key={searchUser.id}
              variant="elevated"
              hover
              className="animate-fade-in transition-all duration-200"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate mb-1">
                      {searchUser.full_name || 'Anonymous User'}
                    </h3>
                    {searchUser.location && (
                      <p className="text-sm text-foreground-secondary truncate mb-2">{searchUser.location}</p>
                    )}
                    {searchUser.dance_preferences && searchUser.dance_preferences.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {searchUser.dance_preferences.slice(0, 3).map((style, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 text-xs bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-full font-medium"
                          >
                            {style}
                          </span>
                        ))}
                        {searchUser.dance_preferences.length > 3 && (
                          <span className="inline-block px-2 py-0.5 text-xs bg-background-tertiary text-foreground-tertiary rounded-full">
                            +{searchUser.dance_preferences.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              
                <div className="flex-shrink-0">
                  {getActionButton(searchUser)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <Card variant="elevated" className="text-center py-12 animate-fade-in">
          <CardContent>
            <div className="w-16 h-16 bg-gradient-to-r from-foreground-muted/20 to-foreground-muted/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-foreground-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
            <p className="text-foreground-secondary">Try searching with a different name or email</p>
          </CardContent>
        </Card>
      )}

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <Card variant="outlined" className="text-center py-8 animate-fade-in">
          <CardContent>
            <Search className="w-8 h-8 text-foreground-tertiary mx-auto mb-3" />
            <p className="text-foreground-tertiary text-sm">Type at least 2 characters to search</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

UserSearch.displayName = 'UserSearch'

export default UserSearch