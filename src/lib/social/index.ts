/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
// Main export file for the social module
// Re-exports all types and functions from individual files

// Re-export all types
export * from './types';

// Re-export all utility functions
export * from './utils';

// Re-export all post-related functions
export * from './posts';

// Re-export all story-related functions
export * from './stories';

// Re-export all comment-related functions
export * from './comments';

// Re-export all reaction-related functions
export * from './reactions';

// Re-export all bookmark-related functions
export * from './bookmarks';

// Re-export all profile-related functions
export * from './profiles';

import { Post, Story, Comment, Profile } from './types';

// For backward compatibility
export const socialService = {
  // Posts
  getPosts: async (): Promise<Post[]> => import('./posts').then(m => m.getPosts()),
  createPost: async (post: unknown): Promise<Post> => import('./posts').then(m => m.createPost(post as any)),
  editPost: async (postId: string, updates: unknown): Promise<Post> => import('./posts').then(m => m.editPost(postId, updates as any)),
  deletePost: async (postId: string): Promise<void> => import('./posts').then(m => m.deletePost(postId)),
  getFollowingPosts: async (): Promise<Post[]> => import('./posts').then(m => m.getFollowingPosts()),
  getPostsByHashtag: async (hashtag: string): Promise<Post[]> => import('./posts').then(m => m.getPostsByHashtag(hashtag)),
  getPostsByMention: async (username: string): Promise<Post[]> => import('./posts').then(m => m.getPostsByMention(username)),
  
  // Stories
  getStories: async (): Promise<Story[]> => import('./stories').then(m => m.getStories()),
  createStory: async (story: unknown): Promise<Story> => import('./stories').then(m => m.createStory(story as any)),
  sharePostToStory: async (postId: string): Promise<Story> => import('./stories').then(m => m.sharePostToStory(postId)),
  
  // Comments
  getComments: async (postId: string): Promise<Comment[]> => import('./comments').then(m => m.getComments(postId)),
  createComment: async (comment: { postId: string, content: string, parentId?: string }): Promise<Comment> => 
    import('./comments').then(m => m.createComment(comment.postId, comment.content, comment.parentId)),
  
  // Reactions
  toggleReaction: async (postId: string, reactionType: string): Promise<boolean> => 
    import('./reactions').then(m => m.toggleReaction(postId, reactionType as any)),
  getReactions: async (postId: string): Promise<unknown[]> => import('./reactions').then(m => m.getReactions(postId)),
  toggleLike: async (postId: string): Promise<boolean> => import('./reactions').then(m => m.toggleLike(postId)),
  checkLike: async (postId: string): Promise<boolean> => import('./reactions').then(m => m.checkLike(postId)),
  
  // Bookmarks
  toggleBookmark: async (postId: string): Promise<boolean> => import('./bookmarks').then(m => m.toggleBookmark(postId)),
  getBookmarks: async (): Promise<Post[]> => import('./bookmarks').then(m => m.getBookmarks()),
  checkBookmark: async (postId: string): Promise<boolean> => import('./bookmarks').then(m => m.checkBookmark(postId)),
  
  // Profiles
  getProfile: async (userId: string): Promise<Profile> => import('./profiles').then(m => m.getProfile(userId)),
  updateProfile: async (profile: unknown): Promise<Profile> => import('./profiles').then(m => m.updateProfile(profile as any)),
  
  // Utils
  extractHashtags: (content: string): Promise<string[]> => import('./utils').then(m => m.extractHashtags(content)),
  extractMentions: (content: string): Promise<string[]> => import('./utils').then(m => m.extractMentions(content)),
  uploadFile: async (file: File, bucket: 'social-images' | 'social-videos' | 'stories'): Promise<string> => 
    import('./utils').then(m => m.uploadFile(file, bucket)),
  // Media functions
  uploadMultipleFiles: async (files: File[], bucket: 'social-images' | 'social-videos' | 'media-collections'): Promise<string[]> => 
    import('./utils').then(m => m.uploadMultipleFiles(files, bucket)),
  applyMediaEditing: async (file: File, metadata: unknown): Promise<Blob> => 
    import('./utils').then(m => m.applyMediaEditing(file, metadata as any)),
  
  // Collections - fallback to main social.ts implementation
  getCollections: async (): Promise<unknown[]> => import('../social').then(m => m.socialService.getCollections()),
  createCollection: async (collection: { name: string; description?: string; is_private: boolean }): Promise<unknown> => 
    import('../social').then(m => m.socialService.createCollection(collection)),
  getCollectionItems: async (collectionId: string): Promise<unknown[]> => 
    import('../social').then(m => m.socialService.getCollectionItems(collectionId)),
  addToCollection: async (collectionId: string, postId: string): Promise<void> => 
    import('../social').then(m => m.socialService.addToCollection(collectionId, postId)),
  removeFromCollection: async (collectionId: string, postId: string): Promise<void> => 
    import('../social').then(m => m.socialService.removeFromCollection(collectionId, postId)),
  deleteCollection: async (collectionId: string): Promise<void> => 
    import('../social').then(m => m.socialService.deleteCollection(collectionId)),
};