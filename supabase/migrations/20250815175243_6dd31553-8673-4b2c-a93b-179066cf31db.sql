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