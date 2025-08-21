'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Edit3, Calendar, MapPin, Instagram, Save, X, Music } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUpcomingUserEvents } from '@/hooks/useEvents'
import { supabase } from '@/lib/supabase'
import EventCard from '@/components/EventCard'

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
  const { user, profile, signOut } = useAuth()
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useUpcomingUserEvents()
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sign in to view your profile
          </h2>
          <p className="text-gray-600 mb-4">
            Create an account to track your events and connect with dancers
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 pt-12 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <button
              onClick={() => signOut()}
              className="text-white/80 hover:text-white text-sm"
            >
              Sign Out
            </button>
          </div>

          {/* Profile Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {profile?.full_name || 'Dance Enthusiast'}
                  </h2>
                  <p className="text-white/80 text-sm">{user.email}</p>
                  {profile?.location && (
                    <div className="flex items-center mt-1">
                      <MapPin className="w-4 h-4 text-white/80 mr-1" />
                      <span className="text-white/80 text-sm">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                {isEditing ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Edit3 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            {profile?.bio && (
              <p className="text-white/90 text-sm mb-4">{profile.bio}</p>
            )}

            {profile?.instagram_handle && (
              <div className="flex items-center">
                <Instagram className="w-4 h-4 text-white/80 mr-2" />
                <span className="text-white/80 text-sm">@{profile.instagram_handle}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Dance Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Music className="w-5 h-5 mr-2 text-purple-600" />
            Dance Preferences
          </h3>
          {profile?.dance_preferences && profile.dance_preferences.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.dance_preferences.map((style) => (
                <span
                  key={style}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {style}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No dance preferences set. Edit your profile to add some!
            </p>
          )}
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
            
            {updateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{updateError}</p>
              </div>
            )}

            <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  {...form.register('full_name')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Your full name"
                />
                {form.formState.errors.full_name && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  {...form.register('bio')}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
                {form.formState.errors.bio && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.bio.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  {...form.register('location')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="City, State"
                />
                {form.formState.errors.location && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram Handle
                </label>
                <input
                  {...form.register('instagram_handle')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="username (without @)"
                />
                {form.formState.errors.instagram_handle && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.instagram_handle.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dance Preferences
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {danceStyles.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => handleDancePreferenceToggle(style)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        form.watch('dance_preferences')?.includes(style)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Your Upcoming Events
          </h3>

          {eventsLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32"></div>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <EventCard
                    event={event}
                    checkinStatus={event.checkinStatus}
                    onStatusChange={() => {}} // Read-only in profile view
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No upcoming events</p>
              <p className="text-gray-400 text-sm">
                Check out the events page to find something fun!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}