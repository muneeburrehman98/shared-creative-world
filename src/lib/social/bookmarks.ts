// Bookmark-related functions
import { supabase } from '@/integrations/supabase/client';
import { Post } from './types';

export async function toggleBookmark(postId: string): Promise<boolean> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  // Check if the bookmark already exists
  const { data: existingBookmark } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.data.user.id)
    .single();

  if (existingBookmark) {
    // Remove the bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', existingBookmark.id);

    if (error) throw error;
    return false;
  } else {
    // Add the bookmark
    const { error } = await supabase
      .from('bookmarks')
      .insert([{ 
        post_id: postId, 
        user_id: user.data.user.id
      }]);

    if (error) throw error;
    return true;
  }
}

export async function getBookmarks(): Promise<Post[]> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return [];

  // Get bookmarked posts
  const { data, error } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', user.data.user.id);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fetch the actual posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
    .in('id', data.map(b => b.post_id))
    .order('created_at', { ascending: false });

  if (postsError) throw postsError;
  return posts as unknown as Post[] || [];
}

export async function checkBookmark(postId: string): Promise<boolean> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return false;

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.data.user.id)
    .single();

  return !!data;
}