-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;