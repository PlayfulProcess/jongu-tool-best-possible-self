-- Newsletter Subscribers Table
-- Run this SQL in your Supabase SQL editor to create the newsletter_subscribers table

CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  ip_address TEXT,
  user_agent TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);

-- Row Level Security (RLS) policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow admin operations (insert, select, update, delete)
-- This policy allows operations when using the service role key
CREATE POLICY "Allow admin operations" ON newsletter_subscribers
  FOR ALL USING (true);

-- Insert trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletter_subscribers_updated_at 
  BEFORE UPDATE ON newsletter_subscribers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful comments
COMMENT ON TABLE newsletter_subscribers IS 'Stores email addresses of users who subscribed to the newsletter';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Email address of the subscriber (unique)';
COMMENT ON COLUMN newsletter_subscribers.status IS 'Subscription status: active or unsubscribed';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Where the subscription came from (website, api, etc.)';
COMMENT ON COLUMN newsletter_subscribers.ip_address IS 'IP address of subscriber for analytics';