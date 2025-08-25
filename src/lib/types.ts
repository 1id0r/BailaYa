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

export interface EventWithCheckinStatus extends Event {
  checkinStatus: CheckinStatus
  checkinCount?: {
    going: number
    interested: number
  }
  friendsGoing?: UserProfile[]
  friendsInterested?: UserProfile[]
}

export interface FriendRequest {
  id: string
  requester_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  requester?: UserProfile
  receiver?: UserProfile
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend?: UserProfile
  user?: UserProfile
}