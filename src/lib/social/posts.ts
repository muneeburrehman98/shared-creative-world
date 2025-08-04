// Post-related functions
import { supabase } from '@/integrations/supabase/client';
import { Post } from './types';
import { extractHashtags, extractMentions } from './utils';

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
    .eq('is_private', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as Post[]) || [];
}

export async function createPost(post: {
  content?: string;
  image_url?: string;
  video_url?: string;
  is_private: boolean;
}): Promise<Post> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');
  
  let hashtags: string[] | null = null;
  let mentions: string[] | null = null;
  
  if (post.content) {
    hashtags = extractHashtags(post.content);
    mentions = extractMentions(post.content);
  }
  
  const { data, error } = await supabase
    .from('posts')
    .insert([{ 
      content: post.content,
      image_url: post.image_url,
      video_url: post.video_url,
      is_private: post.is_private,
      user_id: user.data.user.id
    }])
    .select('*')
    .single();

  if (error) throw error;
  return data as unknown as Post;
}

export async function editPost(postId: string, updates: {
  content?: string;
  image_url?: string;
  video_url?: string;
}): Promise<Post> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');
  
  // Simplified edit for current schema
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .eq('user_id', user.data.user.id)
    .select('*')
    .single();

  if (error) throw error;
  return data as unknown as Post;
}

export async function deletePost(postId: string): Promise<void> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

export async function getFollowingPosts(): Promise<Post[]> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return [];

  const { data: followedUsers } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.data.user.id)
    .eq('status', 'accepted');

  if (!followedUsers || followedUsers.length === 0) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .in('user_id', followedUsers.map(f => f.following_id))
    .not('is_private', 'eq', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as Post[]) || [];
}

export async function getPostsByHashtag(hashtag: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .contains('hashtags', [hashtag])
    .not('is_private', 'eq', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as Post[]) || [];
}

export async function getPostsByMention(username: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .contains('mentions', [username])
    .not('is_private', 'eq', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as Post[]) || [];
}