-- Extend profiles table with social features
ALTER TABLE public.profiles 
ADD COLUMN full_name TEXT,
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN dob DATE,
ADD COLUMN nutech_id TEXT,
ADD COLUMN department TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN is_private BOOLEAN DEFAULT false;

-- Create follows table for follow/unfollow functionality
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')) DEFAULT 'accepted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on follows table
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for follows table
CREATE POLICY "Users can view follows they are involved in" 
ON public.follows 
FOR SELECT 
USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create follows for themselves" 
ON public.follows 
FOR INSERT 
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can update follows they created" 
ON public.follows 
FOR UPDATE 
USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can delete follows they created" 
ON public.follows 
FOR DELETE 
USING (follower_id = auth.uid());

-- Add trigger for follows updated_at
CREATE TRIGGER update_follows_updated_at
BEFORE UPDATE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add follower/following counts to profiles
ALTER TABLE public.profiles 
ADD COLUMN followers_count INTEGER DEFAULT 0,
ADD COLUMN following_count INTEGER DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    -- Increase following count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE user_id = NEW.follower_id;
    
    -- Increase followers count for following
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    -- Decrease following count for follower
    UPDATE public.profiles 
    SET following_count = following_count - 1 
    WHERE user_id = OLD.follower_id;
    
    -- Decrease followers count for following
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status change from pending to accepted
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
      UPDATE public.profiles 
      SET following_count = following_count + 1 
      WHERE user_id = NEW.follower_id;
      
      UPDATE public.profiles 
      SET followers_count = followers_count + 1 
      WHERE user_id = NEW.following_id;
    ELSIF OLD.status = 'accepted' AND NEW.status = 'pending' THEN
      UPDATE public.profiles 
      SET following_count = following_count - 1 
      WHERE user_id = NEW.follower_id;
      
      UPDATE public.profiles 
      SET followers_count = followers_count - 1 
      WHERE user_id = NEW.following_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for follow count updates
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_follow_counts();