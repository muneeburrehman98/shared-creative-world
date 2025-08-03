// Utility functions for the social module
import { MediaMetadata } from './types';

export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.match(hashtagRegex);
  if (!matches) return [];
  return matches.map(tag => tag.substring(1));
}

export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  if (!matches) return [];
  return matches.map(mention => mention.substring(1));
}

export async function uploadFile(file: File, bucket: 'social-images' | 'social-videos' | 'stories' | 'media-collections'): Promise<string> {
  const { supabase } = await import('@/integrations/supabase/client');
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, file);
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadMultipleFiles(files: File[], bucket: 'social-images' | 'social-videos' | 'media-collections'): Promise<string[]> {
  const { supabase } = await import('@/integrations/supabase/client');
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
}

export async function applyMediaEditing(file: File, metadata: MediaMetadata): Promise<Blob> {
  // In a real implementation, this would use a library like fabric.js or a canvas-based solution
  // For this example, we'll just return the original file and store the metadata
  return file;
}