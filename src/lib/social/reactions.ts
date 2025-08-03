// Reaction-related functions
import { supabase } from '@/integrations/supabase/client';
import { Reaction } from './types';

export async function toggleReaction(postId: string, reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'): Promise<boolean> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  // Check if the reaction already exists
  const { data: existingReaction } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.data.user.id)
    .eq('reaction_type', reactionType)
    .single();

  if (existingReaction) {
    // Remove the reaction
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existingReaction.id);

    if (error) throw error;
    return false;
  } else {
    // Add the reaction
    const { error } = await supabase
      .from('reactions')
      .insert([{ 
        post_id: postId, 
        user_id: user.data.user.id,
        reaction_type: reactionType
      }]);

    if (error) throw error;
    return true;
  }
}

export async function getReactions(postId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('post_id', postId);

  if (error) throw error;
  return data as Reaction[] || [];
}

export async function toggleLike(postId: string): Promise<boolean> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.data.user.id)
    .single();

  if (existingLike) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.data.user.id);

    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('likes')
      .insert([{ post_id: postId, user_id: user.data.user.id }]);

    if (error) throw error;
    return true;
  }
}

export async function checkLike(postId: string): Promise<boolean> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return false;

  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.data.user.id)
    .single();

  return !!data;
}