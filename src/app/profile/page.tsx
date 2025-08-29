'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Edit3, Calendar, MapPin, Instagram, Save, X, Music, Users, UserPlus, Search, Sparkles, Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUpcomingUserEvents } from '@/hooks/useEvents'
import { useFriends, useFriendsEvents } from '@/hooks/useFriends'
import { supabase } from '@/lib/supabase'
import EventCard from '@/components/EventCard'
import UserSearch from '@/components/UserSearch'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  instagram_handle: z.string().max(30, 'Instagram handle must be less than 30 characters').optional(),
  dance_preferences: z.array(z.string()).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

const danceStyles = [
  'Salsa', 'Bachata', 'Merengue', 'Reggaeton', 'Kizomba', 
  'Zouk', 'Cha-cha', 'Rumba', 'Mambo', 'Cumbia'
]

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useUpcomingUserEvents()
  const { friends, friendRequests, isLoading: friendsLoading } = useFriends()
  const { data: friendsEvents = [], isLoading: friendsEventsLoading } = useFriendsEvents()
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'search'>('profile')

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      instagram_handle: profile?.instagram_handle || '',
      dance_preferences: profile?.dance_preferences || [],
    },
  })

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!user) return

    setIsUpdating(true)
    setUpdateError(null)

    try {
      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update({
            full_name: data.full_name,
            bio: data.bio || null,
            location: data.location || null,
            instagram_handle: data.instagram_handle || null,
            dance_preferences: data.dance_preferences || [],
          })
          .eq('id', user.id)
      } else {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: data.full_name,
            bio: data.bio || null,
            location: data.location || null,
            instagram_handle: data.instagram_handle || null,
            dance_preferences: data.dance_preferences || [],
          })
      }

      if (result.error) {
        setUpdateError(result.error.message)
      } else {
        setIsEditing(false)
        // Refresh the page to get updated data
        window.location.reload()
      }
    } catch {
      setUpdateError('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDancePreferenceToggle = (style: string) => {
    const current = form.getValues('dance_preferences') || []
    const updated = current.includes(style)
      ? current.filter(s => s !== style)
      : [...current, style]
    
    form.setValue('dance_preferences', updated)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="elevated" className="max-w-md mx-4 text-center">
          <CardContent className="py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Sign in to view your profile
            </h2>
            <p className="text-foreground-secondary mb-6">
              Create an account to track your events and connect with dancers
            </p>
            <Button variant="primary" className="w-full">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Modern Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative px-4 pt-16 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Your Profile</h1>
                  <p className="text-white/80">Manage your dance journey</p>
                </div>
              </div>
            </div>

            {/* Modern Profile Card */}
            <Card variant="glass" className="backdrop-blur-xl border-white/20">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-success-500 rounded-full border-3 border-white flex items-center justify-center">
                        <Heart className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {profile?.full_name || 'Dance Enthusiast'}
                      </h2>
                      <p className="text-white/80 text-sm mb-2">{user.email}</p>
                      {profile?.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-white/80 mr-2" />
                          <span className="text-white/80 text-sm">{profile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? 'secondary' : 'ghost'}
                    size="sm"
                    leftIcon={isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {profile?.bio && (
                  <p className="text-white/90 text-sm mb-4 leading-relaxed">{profile.bio}</p>
                )}

                {profile?.instagram_handle && (
                  <div className="flex items-center">
                    <Instagram className="w-4 h-4 text-white/80 mr-3" />
                    <span className="text-white/80 text-sm">@{profile.instagram_handle}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 pb-6">
        {/* Modern Tab Navigation */}
        <Card variant="elevated" className="mb-8">
          <div className="p-2 flex gap-1">
            <Button
              onClick={() => setActiveTab('profile')}
              variant={activeTab === 'profile' ? 'primary' : 'ghost'}
              size="sm"
              leftIcon={<User className="w-4 h-4" />}
              className="flex-1 rounded-xl"
            >
              Profile
            </Button>
            <Button
              onClick={() => setActiveTab('friends')}
              variant={activeTab === 'friends' ? 'secondary' : 'ghost'}
              size="sm"
              leftIcon={<Users className="w-4 h-4" />}
              className="flex-1 rounded-xl relative"
            >
              Friends
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {friendRequests.length}
                </span>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('search')}
              variant={activeTab === 'search' ? 'success' : 'ghost'}
              size="sm"
              leftIcon={<Search className="w-4 h-4" />}
              className="flex-1 rounded-xl"
            >
              Find Friends
            </Button>
          </div>
        </Card>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            {/* Modern Dance Preferences */}
            <Card variant="elevated" className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Dance Preferences
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
                </div>
                {profile?.dance_preferences && profile.dance_preferences.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {profile.dance_preferences.map((style) => (
                      <span
                        key={style}
                        className="bg-gradient-to-r from-secondary-500/20 to-primary-500/20 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-foreground-muted/50 mx-auto mb-4" />
                    <p className="text-foreground-secondary mb-3">
                      No dance preferences set yet
                    </p>
                    <p className="text-foreground-tertiary text-sm">
                      Edit your profile to showcase your favorite dance styles!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

        {/* Modern Edit Form */}
        {isEditing && (
          <Card variant="elevated" className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Edit Profile
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
              </div>
              
              {updateError && (
                <div className="mb-6 p-4 bg-destructive-50 dark:bg-destructive-950 border border-destructive-200 dark:border-destructive-800 rounded-xl">
                  <p className="text-destructive-700 dark:text-destructive-300 text-sm font-medium">{updateError}</p>
                </div>
              )}

              <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name *
                </label>
                <Input
                  {...form.register('full_name')}
                  placeholder="Your full name"
                  className="w-full"
                />
                {form.formState.errors.full_name && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Bio
                </label>
                <textarea
                  {...form.register('bio')}
                  rows={3}
                  className="w-full p-4 border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-foreground bg-background-elevated transition-all duration-200 placeholder:text-foreground-muted"
                  placeholder="Tell us about yourself..."
                />
                {form.formState.errors.bio && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.bio.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Location
                </label>
                <Input
                  {...form.register('location')}
                  placeholder="City, State"
                  className="w-full"
                />
                {form.formState.errors.location && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Instagram Handle
                </label>
                <Input
                  {...form.register('instagram_handle')}
                  placeholder="username (without @)"
                  className="w-full"
                />
                {form.formState.errors.instagram_handle && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.instagram_handle.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Dance Preferences
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {danceStyles.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => handleDancePreferenceToggle(style)}
                      className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                        form.watch('dance_preferences')?.includes(style)
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25'
                          : 'bg-background-tertiary text-foreground hover:bg-background-secondary border border-border'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isUpdating}
                  variant="primary"
                  size="lg"
                  leftIcon={<Save className="w-4 h-4" />}
                  className="flex-1"
                  loading={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="lg"
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        )}

        {/* Modern Upcoming Events */}
        <Card variant="elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Your Upcoming Events
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
            </div>

            {eventsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="skeleton rounded-2xl h-32"></div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <EventCard
                      event={event}
                      checkinStatus={event.checkinStatus}
                      onStatusChange={() => {}} // Read-only in profile view
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-primary-500" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">No upcoming events</h4>
                <p className="text-foreground-secondary mb-4">
                  Check out the events page to find something fun!
                </p>
                <Button variant="outline" size="sm">
                  Browse Events
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
            </>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-6">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      Friend Requests ({friendRequests.length})
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
                  </div>
                  <div className="space-y-4">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-background-secondary rounded-2xl border border-border hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 rounded-2xl flex items-center justify-center">
                            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {request.requester?.full_name || 'Anonymous User'}
                            </p>
                            {request.requester?.location && (
                              <p className="text-sm text-foreground-secondary">{request.requester.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="success" size="sm">
                            Accept
                          </Button>
                          <Button variant="outline" size="sm">
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Friends List */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-success-500 to-primary-500 rounded-2xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Your Friends ({friends.length})
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
                </div>
                
                {friendsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton rounded-2xl h-20"></div>
                    ))}
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-4">
                    {friends.map((friendship) => (
                      <div key={friendship.id} className="flex items-center justify-between p-4 bg-background-secondary rounded-2xl border border-border hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-success-100 to-primary-100 dark:from-success-900 dark:to-primary-900 rounded-2xl flex items-center justify-center">
                            <User className="w-6 h-6 text-success-600 dark:text-success-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {friendship.friend?.full_name || 'Anonymous User'}
                            </p>
                            {friendship.friend?.location && (
                              <p className="text-sm text-foreground-secondary">{friendship.friend.location}</p>
                            )}
                            {friendship.friend?.dance_preferences && friendship.friend.dance_preferences.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {friendship.friend.dance_preferences.slice(0, 3).map((style, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-3 py-1 text-xs bg-gradient-to-r from-secondary-100 to-primary-100 dark:from-secondary-900 dark:to-primary-900 text-secondary-700 dark:text-secondary-300 rounded-full font-semibold"
                                  >
                                    {style}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-destructive-600 dark:text-destructive-400 border-destructive-200 hover:bg-destructive-50">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-success-100 to-primary-100 dark:from-success-900 dark:to-primary-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Users className="w-8 h-8 text-success-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">No friends yet</h4>
                    <p className="text-foreground-secondary mb-4">
                      Search for other dancers to connect with the community!
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('search')}>
                      Find Friends
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friends' Events */}
            {friendsEvents.length > 0 && (
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      Friends&apos; Events
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
                  </div>
                  
                  {friendsEventsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="skeleton rounded-2xl h-32"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {friendsEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
                          <EventCard
                            event={event}
                            checkinStatus={event.checkinStatus}
                            onStatusChange={() => {}}
                          />
                          {/* Show which friends are going */}
                          {((event.friendsGoing?.length ?? 0) > 0 || (event.friendsInterested?.length ?? 0) > 0) && (
                            <div className="px-6 pb-4">
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-950 dark:to-primary-950 rounded-xl">
                                <Users className="w-4 h-4 text-success-600" />
                                <span className="text-sm font-medium text-foreground">
                                  {event.friendsGoing?.slice(0, 2).map(f => f.full_name).join(', ')}
                                  {(event.friendsGoing?.length ?? 0) > 2 && ` +${(event.friendsGoing?.length ?? 0) - 2} more`}
                                  {(event.friendsGoing?.length ?? 0) > 0 && (event.friendsInterested?.length ?? 0) > 0 && ', '}
                                  {event.friendsInterested?.slice(0, 2).map(f => f.full_name).join(', ')}
                                  {(event.friendsInterested?.length ?? 0) > 2 && ` +${(event.friendsInterested?.length ?? 0) - 2} more interested`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Find New Friends
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
              </div>
              <UserSearch />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}