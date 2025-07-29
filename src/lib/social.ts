import { supabase } from '@/integrations/supabase/client';

export interface Post {
  id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  is_private: boolean;
  visibility: 'public' | 'private' | 'followers-only';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  edit_history?: any[];
  hashtags?: string[];
  mentions?: string[];
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
  parent_id?: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  created_at: string;
}

export interface Bookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export const socialService = {
  async getPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Post[]) || [];
  },

  async createPost(post: {
    content?: string;
    image_url?: string;
    video_url?: string;
    is_private: boolean;
    visibility: 'public' | 'private' | 'followers-only';
  }) {
    const user = await supabase.auth.getUser();
    
    // Extract hashtags and mentions if content exists
    let hashtags: string[] | undefined;
    let mentions: string[] | undefined;
    
    if (post.content) {
      hashtags = extractHashtags(post.content);
      mentions = extractMentions(post.content);
    }
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
        ...post, 
        user_id: user.data.user?.id,
        hashtags,
        mentions
      }])
      .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
      .single();

    if (error) throw error;
    return data as Post;
  },

  async editPost(postId: string, updates: {
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
    
    // Extract hashtags and mentions if content is being updated
    let updateData: any = { ...updates };
    
    if (updates.content) {
      updateData.hashtags = extractHashtags(updates.content);
      updateData.mentions = extractMentions(updates.content);
    }
    
    // Add edit timestamp and history
    updateData.edited_at = new Date().toISOString();
    
    // Prepare edit history entry
    const historyEntry = {
      content: currentPost.content,
      edited_at: currentPost.edited_at || currentPost.created_at,
      visibility: currentPost.visibility
    };
    
    // Update the post with edit history
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
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

  async getStories(): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select(`*, profiles!stories_user_id_fkey(username, display_name, avatar_url)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Story[]) || [];
  },

  async createStory(story: {
    content?: string;
    image_url?: string;
    video_url?: string;
  }) {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('stories')
      .insert([{ ...story, user_id: user.data.user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  async sharePostToStory(postId: string): Promise<Story> {
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
  },

  async toggleReaction(postId: string, reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'): Promise<boolean> {
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
  },
  
  async getReactions(postId: string): Promise<Reaction[]> {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId);

    if (error) throw error;
    return data as Reaction[] || [];
  },
  
  async toggleBookmark(postId: string): Promise<boolean> {
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
  },
  
  async getBookmarks(): Promise<Post[]> {
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
    return posts as Post[] || [];
  },

  async toggleLike(postId: string) {
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
  
  async checkBookmark(postId: string): Promise<boolean> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return false;

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.data.user.id)
      .single();

    return !!data;
  },

  async getComments(postId: string): Promise<Comment[]> {
    // First get all comments for the post
    const { data, error } = await supabase
      .from('comments')
      .select(`*, profiles!comments_user_id_fkey(username, display_name, avatar_url)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Organize comments into threads
    const comments = data as Comment[];
    const rootComments: Comment[] = [];
    const commentMap = new Map<string, Comment>();
    
    // First pass: create a map of all comments by ID
    comments.forEach(comment => {
      commentMap.set(comment.id, {...comment, replies: []});
    });
    
    // Second pass: organize into parent-child relationships
    comments.forEach(comment => {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply, add it to its parent's replies
        const parent = commentMap.get(comment.parent_id)!;
        parent.replies!.push(commentMap.get(comment.id)!);
      } else {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id)!);
      }
    });
    
    return rootComments;
  },

  async createComment(postId: string, content: string, parentId?: string) {
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
      .select()
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
  },

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
  },

  async getFollowingPosts(): Promise<Post[]> {
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
  },
  
  async getPostsByHashtag(hashtag: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
      .contains('hashtags', [hashtag])
      .not('is_private', 'eq', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Post[]) || [];
  },
  
  async getPostsByMention(username: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
      .contains('mentions', [username])
      .not('is_private', 'eq', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Post[]) || [];
  }
};

// Move utility functions inside socialService
extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  if (!matches) return [];
  return matches.map(tag => tag.substring(1)); // Remove the # symbol
}

extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return [];
  return matches.map(mention => mention.substring(1)); // Remove the @ symbol
}
