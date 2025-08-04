// Comment-related functions
import { supabase } from '@/integrations/supabase/client';
import { Comment } from './types';

export async function getComments(postId: string): Promise<Comment[]> {
  // First get all comments for the post
  const { data, error } = await supabase
    .from('comments')
    .select(`*, profiles!comments_user_id_fkey(username, display_name, avatar_url)`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Organize comments into threads
  const comments = data as unknown as Comment[];
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
}

export async function createComment(postId: string, content: string, parentId?: string): Promise<Comment> {
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
  return data as unknown as Comment;
}