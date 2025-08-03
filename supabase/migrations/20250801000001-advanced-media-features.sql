-- Create a new bucket for media collections
INSERT INTO storage.buckets (id, name, public) VALUES ('media-collections', 'media-collections', true);

-- Add media_urls array to posts table to support carousel/multi-image posts
ALTER TABLE public.posts ADD COLUMN media_urls TEXT[] DEFAULT NULL;

-- Add media_metadata to store filters, effects, and editing information
ALTER TABLE public.posts ADD COLUMN media_metadata JSONB DEFAULT NULL;

-- Create collections table for saving posts
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_items table to store posts in collections
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, post_id)
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view their own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- Collection items policies
CREATE POLICY "Users can view their own collection items" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid())
);
CREATE POLICY "Users can add items to their own collections" ON public.collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid())
);
CREATE POLICY "Users can delete items from their own collections" ON public.collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid())
);

-- Storage policies for media collections
CREATE POLICY "Media collections are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'media-collections');
CREATE POLICY "Users can upload to media collections" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media-collections' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their media collections" ON storage.objects FOR UPDATE USING (bucket_id = 'media-collections' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their media collections" ON storage.objects FOR DELETE USING (bucket_id = 'media-collections' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update triggers for collections
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();