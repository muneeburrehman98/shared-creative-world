-- Add privacy and GitHub-like features to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS readme_content text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS license text DEFAULT 'MIT';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'internal'));

-- Create project files table for file management
CREATE TABLE IF NOT EXISTS public.project_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  content_type text,
  file_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on project_files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Create policies for project_files
CREATE POLICY "Users can view files in public projects" 
ON public.project_files 
FOR SELECT 
USING (project_id IN (
  SELECT id FROM public.projects 
  WHERE NOT is_private OR user_id = auth.uid()
));

CREATE POLICY "Users can manage files in their projects" 
ON public.project_files 
FOR ALL 
USING (project_id IN (
  SELECT id FROM public.projects 
  WHERE user_id = auth.uid()
));

-- Update projects RLS policies to handle privacy
DROP POLICY IF EXISTS "Users can view all public projects" ON public.projects;

CREATE POLICY "Users can view public projects" 
ON public.projects 
FOR SELECT 
USING (NOT is_private OR user_id = auth.uid());

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for project files with proper casting
CREATE POLICY "Users can view project files they have access to" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-files' AND (
  name ~ '^[0-9a-f-]+/.*' AND 
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.projects p 
    WHERE NOT p.is_private OR p.user_id = auth.uid()
  )
));

CREATE POLICY "Users can upload files to their projects" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-files' AND (
  name ~ '^[0-9a-f-]+/.*' AND 
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.projects p 
    WHERE p.user_id = auth.uid()
  )
));

CREATE POLICY "Users can update files in their projects" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'project-files' AND (
  name ~ '^[0-9a-f-]+/.*' AND 
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.projects p 
    WHERE p.user_id = auth.uid()
  )
));

CREATE POLICY "Users can delete files from their projects" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'project-files' AND (
  name ~ '^[0-9a-f-]+/.*' AND 
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.projects p 
    WHERE p.user_id = auth.uid()
  )
));

-- Create project downloads table for tracking
CREATE TABLE IF NOT EXISTS public.project_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid,
  downloaded_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS on project_downloads
ALTER TABLE public.project_downloads ENABLE ROW LEVEL SECURITY;

-- Create policies for project_downloads
CREATE POLICY "Users can view download stats for their projects" 
ON public.project_downloads 
FOR SELECT 
USING (project_id IN (
  SELECT id FROM public.projects 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Anyone can create download records" 
ON public.project_downloads 
FOR INSERT 
WITH CHECK (true);

-- Add download count to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS downloads_count integer NOT NULL DEFAULT 0;

-- Create trigger for project_files updated_at
CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();