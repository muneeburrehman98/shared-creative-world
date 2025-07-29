ALTER TABLE public.posts
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN edit_history JSONB[],
ADD COLUMN hashtags TEXT[],
ADD COLUMN mentions TEXT[];

-- Create reactions table (beyond basic likes)
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL, -- 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create threaded comments table
CREATE TABLE public.comment_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their reactions" ON public.reactions USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their bookmarks" ON public.bookmarks USING (auth.uid() = user_id);

CREATE POLICY "Users can view comment threads" ON public.comment_threads FOR SELECT USING (true);
CREATE POLICY "Users can manage comment threads" ON public.comment_threads USING (EXISTS (SELECT 1 FROM public.comments WHERE id = comment_threads.comment_id AND user_id = auth.uid()));