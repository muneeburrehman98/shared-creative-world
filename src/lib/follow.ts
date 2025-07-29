import { supabase } from '@/integrations/supabase/client';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  updated_at: string;
}

export const followService = {
  // Follow/Unfollow actions
  async followUser(followingId: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    // Check if user is trying to follow themselves
    if (user.data.user.id === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id, status')
      .eq('follower_id', user.data.user.id)
      .eq('following_id', followingId)
      .single();

    if (existingFollow) {
      throw new Error('Already following this user');
    }

    // Check if target user has private account
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('is_private')
      .eq('user_id', followingId)
      .single();

    const status = targetProfile?.is_private ? 'pending' : 'accepted';

    const { data, error } = await supabase
      .from('follows')
      .insert([{
        follower_id: user.data.user.id,
        following_id: followingId,
        status
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unfollowUser(followingId: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.data.user.id)
      .eq('following_id', followingId);

    if (error) throw error;
  },

  async acceptFollowRequest(followerId: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('follows')
      .update({ status: 'accepted' })
      .eq('follower_id', followerId)
      .eq('following_id', user.data.user.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectFollowRequest(followerId: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', user.data.user.id)
      .eq('status', 'pending');

    if (error) throw error;
  },

  // Check follow status
  async getFollowStatus(followingId: string): Promise<'not_following' | 'pending' | 'following'> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return 'not_following';

    const { data } = await supabase
      .from('follows')
      .select('status')
      .eq('follower_id', user.data.user.id)
      .eq('following_id', followingId)
      .single();

    if (!data) return 'not_following';
    return data.status === 'accepted' ? 'following' : 'pending';
  },

  // Get followers/following lists
  async getFollowers(userId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        status,
        profiles!follows_follower_id_fkey(user_id, username, display_name, avatar_url)
      `)
      .eq('following_id', userId)
      .eq('status', 'accepted');

    if (error) throw error;

    // Manually fetch profiles since join might not work
    if (!data || data.length === 0) return [];

    const followerIds = data.map(f => f.follower_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', followerIds);

    return data.map(follow => ({
      ...follow,
      profile: profiles?.find(p => p.user_id === follow.follower_id) || null
    }));
  },

  async getFollowing(userId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        status,
        profiles!follows_following_id_fkey(user_id, username, display_name, avatar_url)
      `)
      .eq('follower_id', userId)
      .eq('status', 'accepted');

    if (error) throw error;

    // Manually fetch profiles since join might not work
    if (!data || data.length === 0) return [];

    const followingIds = data.map(f => f.following_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', followingIds);

    return data.map(follow => ({
      ...follow,
      profile: profiles?.find(p => p.user_id === follow.following_id) || null
    }));
  },

  // Get pending follow requests (for the current user)
  async getPendingRequests() {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, created_at')
      .eq('following_id', user.data.user.id)
      .eq('status', 'pending');

    if (error) throw error;

    // Manually fetch profiles
    if (!data || data.length === 0) return [];

    const followerIds = data.map(f => f.follower_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', followerIds);

    return data.map(request => ({
      ...request,
      profile: profiles?.find(p => p.user_id === request.follower_id) || null
    }));
  }
};