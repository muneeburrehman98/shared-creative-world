// Profile-related functions
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

export async function getProfile(userId?: string): Promise<Profile> {
  const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates: {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  is_private?: boolean;
}): Promise<Profile> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.data.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}