import { supabase } from '@/integrations/supabase/client';
import { EditHistory, Story, Comment, Reaction, Bookmark, Profile, Post, MediaMetadata, Collection, CollectionItem, MediaEffect } from './social/types';

// Fix return types and error handling
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

  extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    if (!matches) return [];
    return matches.map(tag => tag.substring(1));
  },

  extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];
    return matches.map(mention => mention.substring(1));
  },

  // Inside the socialService object
  async createPost(post: {
    content?: string;
    image_url?: string;
    video_url?: string;
    media_urls?: string[];
    media_metadata?: MediaMetadata | null;
    is_private: boolean;
    visibility: 'public' | 'private' | 'followers-only';
  }): Promise<Post> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    
    let hashtags: string[] | null = null;
    let mentions: string[] | null = null;
    
    if (post.content) {
      hashtags = this.extractHashtags(post.content);
      mentions = this.extractMentions(post.content);
    }
    
    // Add the new fields to the post data
    const postData = { 
      ...post, 
      user_id: user.data.user.id,
      hashtags,
      mentions,
      edit_history: [],
      edited_at: null,
      likes_count: 0,
      comments_count: 0
    };
    
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select(`*, profiles!posts_user_id_fkey(username, display_name, avatar_url)`)
      .single();
  
    if (error) throw error;
    return data as Post;
  },
  
  // Collection-related functions
  async getCollections(): Promise<Collection[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform the data to include item_count
    return (data as unknown[]).map((collection: unknown) => {
      const typedCollection = collection as Collection & { collection_items?: Array<{ count: number }> };
      return {
        ...typedCollection,
        item_count: typedCollection.collection_items?.[0]?.count || 0,
        collection_items: undefined
      } as Collection;
    });
  },
  
  async createCollection(collection: {
    name: string;
    description?: string;
    is_private: boolean;
  }): Promise<Collection> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('collections')
      .insert([{ ...collection, user_id: user.data.user.id }])
      .select()
      .single();
  
    if (error) throw error;
    return data as Collection;
  },
  
  async getCollectionItems(collectionId: string): Promise<CollectionItem[]> {
    const { data, error } = await supabase
      .from('collection_items')
      .select(`*, posts!collection_items_post_id_fkey(id, content, image_url, video_url, media_urls, media_metadata, is_private, visibility, likes_count, comments_count, created_at, user_id, hashtags, mentions, edit_history, edited_at, profiles!posts_user_id_fkey(username, display_name, avatar_url))`)
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as CollectionItem[]) || [];
  },
  
  async addToCollection(collectionId: string, postId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('collection_items')
      .insert([{ collection_id: collectionId, post_id: postId }]);

    if (error) throw error;
  },
  
  async removeFromCollection(collectionId: string, postId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('post_id', postId);

    if (error) throw error;
  },
  
  async deleteCollection(collectionId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.data.user.id);

    if (error) throw error;
  },
  
    async editPost(postId: string, updates: {
    content?: string;
    image_url?: string;
    video_url?: string;
    media_urls?: string[];
    media_metadata?: MediaMetadata | null;
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
      updateData.hashtags = this.extractHashtags(updates.content);
      updateData.mentions = this.extractMentions(updates.content);
    }
    
    updateData.edited_at = new Date().toISOString();
    
    const historyEntry: EditHistory = {
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
  },

  async deletePost(postId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    
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

  async toggleLike(postId: string): Promise<boolean> {
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

  async createComment(postId: string, content: string, parentId?: string): Promise<Comment> {
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
      .select(`*, profiles!comments_user_id_fkey(username, display_name, avatar_url)`)
      .single();

    if (error) throw error;
    return data as Comment;
  },

  async uploadFile(file: File, bucket: 'social-images' | 'social-videos' | 'stories' | 'media-collections'): Promise<string> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  },
  async getProfile(userId?: string): Promise<Profile> {
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
  },
  
  // Upload multiple files for carousel posts
  async uploadMultipleFiles(files: File[], bucket: 'social-images' | 'social-videos' | 'media-collections'): Promise<string[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const urls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.data.user.id}/${Date.now()}-${urls.length}.${fileExt}`;

      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }

    return urls;
  },

  // Apply media editing (filters, effects, etc.)
  async applyMediaEditing(file: File, metadata: MediaMetadata): Promise<Blob> {
    // In a real implementation, this would use a library like fabric.js or a canvas-based solution
    // For this example, we'll just return the original file and store the metadata
    return file;
  }
};

// Export the types from the types file