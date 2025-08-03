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
  return (data as Post[]) || [];
}

export async function createPost(post: {
  content?: string;
  image_url?: string;
  video_url?: string;
  is_private: boolean;
  visibility: 'public' | 'private' | 'followers-only';
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
      ...post, 
      user_id: user.data.user.id,
      hashtags,
      mentions,
      edit_history: [],
      edited_at: null,
      likes_count: 0,
      comments_count: 0
    }])
    .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function editPost(postId: string, updates: {
  content?: string;
  image_url?: string;
  video_url?: string;
  visibility?: 'public' | 'private' | 'followers-only';
}): Promise<Post> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');
  
  // Get the current post to store in edit history
  const { data: currentPost } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', user.data.user.id)
    .single();
    
  if (!currentPost) throw new Error('Post not found or you do not have permission to edit');
  
  const updateData: Partial<Post> = { ...updates };
  
  if (updates.content) {
    updateData.hashtags = extractHashtags(updates.content);
    updateData.mentions = extractMentions(updates.content);
  }
  
  updateData.edited_at = new Date().toISOString();
  
  const historyEntry = {
    content: currentPost.content,
    edited_at: currentPost.edited_at || currentPost.created_at,
    visibility: currentPost.visibility
  };
  
  const { data, error } = await supabase
    .from('posts')
    .update({
      ...updateData,
      edit_history: currentPost.edit_history ? 
        [...currentPost.edit_history, historyEntry] : 
        [historyEntry]
    })
    .eq('id', postId)
    .eq('user_id', user.data.user.id)
    .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
    .single();

  if (error) throw error;
  return data as Post;
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
    .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
    .in('user_id', followedUsers.map(f => f.following_id))
    .not('is_private', 'eq', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Post[]) || [];
}

export async function getPostsByHashtag(hashtag: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
    .contains('hashtags', [hashtag])
    .not('is_private', 'eq', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Post[]) || [];
}

export async function getPostsByMention(username: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
    .contains('mentions', [username])
    .not('is_private', 'eq', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Post[]) || [];
}