// Define all type definitions for the social module

export type EditHistory = {
  content: string | null;
  edited_at: string;
  visibility: 'public' | 'private' | 'followers-only';
};

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

export interface Profile {
  user_id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_private: boolean;
}

// Media filter/effect type for advanced editing
export interface MediaEffect {
  type: 'filter' | 'effect' | 'adjustment';
  name: string;
  intensity?: number;
  parameters?: Record<string, unknown>;
}

// Media metadata for storing editing information
export interface MediaMetadata {
  effects?: MediaEffect[];
  originalUrl?: string;
  dimensions?: { width: number; height: number };
  layout?: 'original' | 'square' | 'portrait' | 'landscape';
  creationInfo?: {
    device?: string;
    app?: string;
    createdWith?: 'camera' | 'upload' | 'creative_mode';
  };
}

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  // New fields for multi-image posts and advanced editing
  media_urls: string[] | null;
  media_metadata: MediaMetadata | null;
  is_private: boolean;
  visibility: 'public' | 'private' | 'followers-only';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  edit_history: EditHistory[];
  hashtags: string[] | null;
  mentions: string[] | null;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// New interfaces for collections feature
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  post_id: string;
  created_at: string;
  post?: Post;
}