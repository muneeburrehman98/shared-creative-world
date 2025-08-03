// Story-related functions
import { supabase } from '@/integrations/supabase/client';
import { Story } from './types';

export async function getStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(`*, profiles!stories_user_id_fkey(username, display_name, avatar_url)`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Story[]) || [];
}

export async function createStory(story: {
  content?: string;
  image_url?: string;
  video_url?: string;
}): Promise<Story> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('stories')
    .insert([{ ...story, user_id: user.data.user.id }])
    .select(`*, profiles!stories_user_id_fkey(username, display_name, avatar_url)`)
    .single();

  if (error) throw error;
  return data as Story;
}

export async function sharePostToStory(postId: string): Promise<Story> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');
  
  // Get the post to share
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();
    
  if (!post) throw new Error('Post not found');
  
  // Create a story with a reference to the post
  const { data, error } = await supabase
    .from('stories')
    .insert([{ 
      user_id: user.data.user.id,
      content: `Shared post: ${postId}`,
      image_url: post.image_url,
      video_url: post.video_url
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Story;
}