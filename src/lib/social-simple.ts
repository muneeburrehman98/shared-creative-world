import { supabase } from '@/integrations/supabase/client';

// Simplified social service that works with current database schema
export interface SimplePost {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  is_private: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface SimpleStory {
  id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  expires_at: string;
  created_at: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface SimpleComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id?: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  replies?: SimpleComment[];
}

export const simpleSocialService = {
  async getPosts(): Promise<SimplePost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPost(post: {
    content?: string;
    image_url?: string;
    video_url?: string;
    is_private: boolean;
  }): Promise<SimplePost> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{ ...post, user_id: user.data.user.id }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async getStories(): Promise<SimpleStory[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createStory(story: {
    content?: string;
    image_url?: string;
    video_url?: string;
  }): Promise<SimpleStory> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('stories')
      .insert([{ ...story, user_id: user.data.user.id }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async toggleLike(postId: string): Promise<boolean> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.data.user.id)
      .maybeSingle();

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
  },

  async checkLike(postId: string): Promise<boolean> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return false;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.data.user.id)
      .maybeSingle();

    return !!data;
  },

  async getComments(postId: string): Promise<SimpleComment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createComment(postId: string, content: string, parentId?: string): Promise<SimpleComment> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert([{ 
        post_id: postId, 
        user_id: user.data.user.id, 
        content,
        parent_id: parentId
      }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async uploadFile(file: File, bucket: 'social-images' | 'social-videos' | 'stories'): Promise<string> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  }
};