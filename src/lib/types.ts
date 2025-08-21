export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  dance_preferences: string[] | null
  bio: string | null
  location: string | null
  instagram_handle: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  date_time: string
  venue_name: string
  venue_address: string
  dance_styles: string[]
  entry_price: number | null
  organizer_name: string | null
  organizer_contact: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EventCheckin {
  id: string
  user_id: string
  event_id: string
  status: 'going' | 'interested'
  checked_in_at: string
  user?: UserProfile
  event?: Event
}

export type CheckinStatus = 'going' | 'interested' | null