import { supabase } from '@/integrations/supabase/client';

export interface Post {
  id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  is_private: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Story {
  id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  expires_at: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const socialService = {
  // Posts CRUD
  async getPosts(): Promise<Post[]> {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!posts) return [];

    // Get profiles for all user_ids
    const userIds = posts.map(post => post.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    // Combine posts with profile data
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return posts.map(post => ({
      ...post,
      profiles: profileMap.get(post.user_id) || { username: '', display_name: '', avatar_url: null }
    })) as Post[];
  },

  async createPost(post: {
    content?: string;
    image_url?: string;
    video_url?: string;
    is_private: boolean;
  }) {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ ...post, user_id: (await supabase.auth.getUser()).data.user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  // Stories CRUD
  async getStories(): Promise<Story[]> {
    const { data: stories, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!stories) return [];

    // Get profiles for all user_ids
    const userIds = stories.map(story => story.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    // Combine stories with profile data
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return stories.map(story => ({
      ...story,
      profiles: profileMap.get(story.user_id) || { username: '', display_name: '', avatar_url: null }
    })) as Story[];
  },

  async createStory(story: {
    content?: string;
    image_url?: string;
    video_url?: string;
  }) {
    const { data, error } = await supabase
      .from('stories')
      .insert([{ ...story, user_id: (await supabase.auth.getUser()).data.user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Likes
  async toggleLike(postId: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    // Check if like exists
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.data.user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.data.user.id);

      if (error) throw error;
      return false;
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: user.data.user.id }]);

      if (error) throw error;
      return true;
    }
  },

  async checkLike(postId: string): Promise<boolean> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return false;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.data.user.id)
      .single();

    return !!data;
  },

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!comments) return [];

    // Get profiles for all user_ids
    const userIds = comments.map(comment => comment.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    // Combine comments with profile data
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return comments.map(comment => ({
      ...comment,
      profiles: profileMap.get(comment.user_id) || { username: '', display_name: '', avatar_url: null }
    })) as Comment[];
  },

  async createComment(postId: string, content: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: user.data.user.id, content }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // File uploads
  async uploadFile(file: File, bucket: 'social-images' | 'social-videos' | 'stories'): Promise<string> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  // Profile
  async getProfile(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(updates: {
    username?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    is_private?: boolean;
  }) {
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
};