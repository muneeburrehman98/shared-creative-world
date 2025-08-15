-- Create missing database functions for project operations
CREATE OR REPLACE FUNCTION public.increment_star_count(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE projects 
  SET stars_count = stars_count + 1 
  WHERE id = project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_star_count(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE projects 
  SET stars_count = GREATEST(stars_count - 1, 0)
  WHERE id = project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_download_count(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE projects 
  SET downloads_count = downloads_count + 1 
  WHERE id = project_id;
END;
$$;

-- Create missing storage bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for project images
CREATE POLICY IF NOT EXISTS "Anyone can view project images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-images');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload project images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- Create storage policies for project files  
CREATE POLICY IF NOT EXISTS "Users can view files in public projects" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'project-files' AND 
  (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM projects p 
    WHERE NOT p.is_private OR p.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Project owners can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'project-files' AND 
  (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM projects p 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Project owners can delete files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'project-files' AND 
  (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM projects p 
    WHERE p.user_id = auth.uid()
  )
);