-- BailaCheck Database Setup Script
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS public.friendships;
DROP TABLE IF EXISTS public.friend_requests;
DROP TABLE IF EXISTS public.event_checkins;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.profiles;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  dance_preferences text[] DEFAULT '{}',
  bio text,
  location text,
  instagram_handle text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Events table
CREATE TABLE public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  date_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  venue_name text NOT NULL,
  venue_address text NOT NULL,
  dance_styles text[] NOT NULL DEFAULT '{}',
  entry_price decimal(10,2) DEFAULT 0,
  organizer_name text,
  organizer_contact text,
  organizer_id uuid REFERENCES public.profiles(id),
  image_url text,
  max_capacity integer,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Event check-ins table
CREATE TABLE public.event_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('going', 'interested')) NOT NULL,
  checked_in_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Friend requests table
CREATE TABLE public.friend_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- Friendships table
CREATE TABLE public.friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_events_date_time ON public.events(date_time);
CREATE INDEX idx_events_active ON public.events(is_active);
CREATE INDEX idx_events_featured ON public.events(is_featured);
CREATE INDEX idx_event_checkins_user_id ON public.event_checkins(user_id);
CREATE INDEX idx_event_checkins_event_id ON public.event_checkins(event_id);
CREATE INDEX idx_event_checkins_status ON public.event_checkins(status);
CREATE INDEX idx_friend_requests_requester ON public.friend_requests(requester_id);
CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all events" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Event organizers can manage their events" ON public.events
  FOR ALL USING (organizer_id = auth.uid());

CREATE POLICY "Admin users can manage all events" ON public.events
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE email = 'admin@bailacheck.com'
    )
  );

-- Event check-ins policies
CREATE POLICY "Users can view all check-ins" ON public.event_checkins
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own check-ins" ON public.event_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins" ON public.event_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins" ON public.event_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Friend requests policies
CREATE POLICY "Users can view their friend requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update received friend requests" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own friend requests" ON public.friend_requests
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER event_checkins_updated_at
  BEFORE UPDATE ON public.event_checkins
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert sample data for testing
INSERT INTO public.events (
  title,
  description,
  date_time,
  end_time,
  venue_name,
  venue_address,
  dance_styles,
  entry_price,
  organizer_name,
  organizer_contact,
  image_url,
  is_featured
) VALUES
(
  'Salsa Night at Luna Lounge',
  'Join us for an unforgettable evening of salsa dancing! Beginners welcome - we start with a 30-minute lesson.',
  (NOW() + INTERVAL '3 days')::timestamp with time zone,
  (NOW() + INTERVAL '3 days' + INTERVAL '4 hours')::timestamp with time zone,
  'Luna Lounge',
  '123 Dance Street, Miami, FL 33101',
  ARRAY['salsa', 'bachata'],
  15.00,
  'Carlos Rodriguez',
  'carlos@lunalounge.com',
  'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500',
  true
),
(
  'Bachata Workshop & Social',
  'Improve your bachata technique with professional instructors followed by open dancing.',
  (NOW() + INTERVAL '5 days')::timestamp with time zone,
  (NOW() + INTERVAL '5 days' + INTERVAL '3 hours')::timestamp with time zone,
  'DanceFit Studio',
  '456 Rhythm Ave, Miami, FL 33102',
  ARRAY['bachata'],
  20.00,
  'Maria Santos',
  'maria@dancefitstudio.com',
  'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=500',
  false
),
(
  'Latin Mix Friday',
  'Multi-genre Latin dance party featuring salsa, bachata, merengue, and reggaeton.',
  (NOW() + INTERVAL '7 days')::timestamp with time zone,
  (NOW() + INTERVAL '7 days' + INTERVAL '5 hours')::timestamp with time zone,
  'Club Havana',
  '789 Tropical Blvd, Miami, FL 33103',
  ARRAY['salsa', 'bachata', 'merengue', 'reggaeton'],
  25.00,
  'DJ Fuego',
  'bookings@clubhavana.com',
  'https://images.unsplash.com/photo-1574391884720-bbc2f7d5e807?w=500',
  true
);

-- Create admin user function (run after creating your admin account)
-- UPDATE: Replace 'your-admin-email@example.com' with your actual admin email
/*
UPDATE public.profiles 
SET email = 'admin@bailacheck.com' 
WHERE email = 'your-admin-email@example.com';
*/