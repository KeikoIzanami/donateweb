-- Run this SQL in Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Overlay settings for each user
CREATE TABLE overlay_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE,
  theme TEXT DEFAULT 'default',
  bg_color TEXT DEFAULT '#1a1a2e',
  text_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#e94560',
  font_size INT DEFAULT 24,
  duration INT DEFAULT 5,
  sound_enabled BOOLEAN DEFAULT true,
  sound_url TEXT,
  alert_image_url TEXT,
  min_amount INT DEFAULT 1000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sepay settings for each user
CREATE TABLE sepay_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  sepay_api_key TEXT,
  sepay_webhook_secret TEXT,
  use_api BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES profiles(id),
  donor_name TEXT DEFAULT 'Anonymous',
  message TEXT,
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlay_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sepay_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for overlay_settings
CREATE POLICY "Users can view own overlay settings"
  ON overlay_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own overlay settings"
  ON overlay_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own overlay settings"
  ON overlay_settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sepay_settings
CREATE POLICY "Users can view own sepay settings"
  ON sepay_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sepay settings"
  ON sepay_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sepay settings"
  ON sepay_settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for donations
CREATE POLICY "Anyone can insert donations"
  ON donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Streamers can view own donations"
  ON donations FOR SELECT USING (auth.uid() = streamer_id);

-- Enable Realtime for donations table
ALTER PUBLICATION supabase_realtime ADD TABLE donations;

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'username');

  INSERT INTO public.overlay_settings (user_id)
  VALUES (NEW.id);

  INSERT INTO public.sepay_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
