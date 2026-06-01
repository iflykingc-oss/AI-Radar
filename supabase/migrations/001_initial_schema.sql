-- AI Radar Database Schema
-- Migration 001: Initial schema

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  name_zh TEXT,
  description TEXT,
  description_en TEXT,
  description_zh TEXT,
  website_url TEXT,
  github_url TEXT,
  logo_url TEXT,
  category TEXT,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  pricing_model TEXT CHECK (pricing_model IN ('free', 'freemium', 'paid', 'open_source')),
  pricing_url TEXT,
  availability_status TEXT DEFAULT 'active' CHECK (availability_status IN ('active', 'low_active', 'inactive', 'dead')),
  commercialization_status TEXT,
  funding_stage TEXT,
  founder_info TEXT,
  launch_date DATE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence_score INTEGER DEFAULT 0,
  confidence_level TEXT DEFAULT 'unverified' CHECK (confidence_level IN ('high', 'medium', 'low', 'unverified')),
  validation_signals JSONB DEFAULT '{}',
  source_count INTEGER DEFAULT 0,
  weekly_growth_rate NUMERIC DEFAULT 0,
  monthly_growth_rate NUMERIC DEFAULT 0,
  github_stars INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_confidence ON products(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_github ON products(github_stars DESC);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  avatar_url TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  plan TEXT DEFAULT 'free',
  preferred_language TEXT DEFAULT 'en',
  interest_tags TEXT[] DEFAULT '{}',
  region_preferences TEXT[] DEFAULT '{}',
  consent_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Push channels table
CREATE TABLE IF NOT EXISTS push_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  webhook_url TEXT,
  webhook_secret TEXT,
  push_frequency TEXT DEFAULT 'daily',
  push_time TEXT,
  notify_new_products BOOLEAN DEFAULT true,
  notify_status_change BOOLEAN DEFAULT true,
  notify_test_failure BOOLEAN DEFAULT true,
  notify_weekly_report BOOLEAN DEFAULT true,
  notify_opportunity_alert BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_push_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_channels ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);

-- User profiles: users can only see their own profile
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Watchlist: users can only manage their own watchlist
CREATE POLICY "watchlist_select_own" ON watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "watchlist_insert_own" ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watchlist_delete_own" ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- Push channels: users can only manage their own channels
CREATE POLICY "push_channels_select_own" ON push_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_channels_insert_own" ON push_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_channels_update_own" ON push_channels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "push_channels_delete_own" ON push_channels FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
