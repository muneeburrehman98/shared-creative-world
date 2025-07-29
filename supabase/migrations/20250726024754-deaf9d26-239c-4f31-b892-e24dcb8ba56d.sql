-- Update RLS policies for posts to support followers viewing private posts

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;

-- Create updated policies for post visibility
CREATE POLICY "Users can view public posts" 
ON public.posts 
FOR SELECT 
USING (NOT is_private);

CREATE POLICY "Users can view private posts from followed users"
ON public.posts
FOR SELECT
USING (
  is_private AND 
  user_id IN (
    SELECT following_id 
    FROM public.follows 
    WHERE follower_id = auth.uid() 
    AND status = 'accepted'
  )
);