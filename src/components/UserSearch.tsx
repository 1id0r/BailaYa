'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, User, UserPlus, Check, Clock, X } from 'lucide-react'
import { useUserSearch, UserWithFriendStatus } from '@/hooks/useUserSearch'
import { useAuth } from '@/contexts/AuthContext'

const UserSearch = () => {
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

  // Debounced search with useRef to prevent re-creation
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    if (searchQuery.trim().length >= 2) {
      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery.trim())
      }, 300)
    } else if (searchQuery.trim().length === 0) {
      // Clear results immediately if query is empty
      searchUsers('')
    }

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

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
    const baseClasses = "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    
    switch (user.friendStatus) {
      case 'friends':
        return (
          <div className="flex items-center gap-1 text-green-700 text-sm">
            <Check className="w-4 h-4" />
            Friends
          </div>
        )
      
      case 'pending_sent':
        return (
          <div className="flex items-center gap-1 text-yellow-700 text-sm">
            <Clock className="w-4 h-4" />
            Pending
          </div>
        )
      
      case 'pending_received':
        return (
          <div className="flex gap-1">
            <button
              onClick={() => handleFriendAction('accept', user.id, user.friendRequestId)}
              disabled={isPerformingAction}
              className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-200`}
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleFriendAction('decline', user.id, user.friendRequestId)}
              disabled={isPerformingAction}
              className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-200`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      
      default:
        return (
          <button
            onClick={() => handleFriendAction('send', user.id)}
            disabled={isPerformingAction}
            className={`${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`}
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Add Friend
          </button>
        )
    }
  }, [handleFriendAction, isPerformingAction])

  if (!user) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Sign in to search for users</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search for dancers by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
        />
      </div>

      {/* Search Results */}
      {isSearching && searchQuery.length >= 2 && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-20"></div>
          ))}
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((searchUser) => (
            <div
              key={searchUser.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {searchUser.full_name || 'Anonymous User'}
                  </h3>
                  {searchUser.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{searchUser.location}</p>
                  )}
                  {searchUser.dance_preferences && searchUser.dance_preferences.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {searchUser.dance_preferences.slice(0, 3).map((style, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                          {style}
                        </span>
                      ))}
                      {searchUser.dance_preferences.length > 3 && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
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
            </div>
          ))}
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found</p>
          <p className="text-gray-400 text-sm">Try searching with a different name or email</p>
        </div>
      )}

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  )
}

export default UserSearch