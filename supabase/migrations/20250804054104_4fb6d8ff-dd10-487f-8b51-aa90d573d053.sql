-- Add missing columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'followers-only')),
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS mentions TEXT[],
ADD COLUMN IF NOT EXISTS media_urls TEXT[],
ADD COLUMN IF NOT EXISTS media_metadata JSONB;

-- Create missing technologies table
CREATE TABLE IF NOT EXISTS public.technologies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on technologies
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;

-- Create policy for technologies (public read access)
CREATE POLICY "Anyone can view technologies" 
ON public.technologies 
FOR SELECT 
USING (true);

-- Add missing columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS repo_url TEXT,
ADD COLUMN IF NOT EXISTS forked_from UUID;

-- Insert some common technologies
INSERT INTO public.technologies (name, color) VALUES
('React', '#61DAFB'),
('TypeScript', '#3178C6'),
('JavaScript', '#F7DF1E'),
('Node.js', '#339933'),
('Python', '#3776AB'),
('Java', '#007396'),
('HTML', '#E34F26'),
('CSS', '#1572B6'),
('Vue.js', '#4FC08D'),
('Angular', '#DD0031'),
('Svelte', '#FF3E00'),
('Next.js', '#000000'),
('Express', '#000000'),
('MongoDB', '#47A248'),
('PostgreSQL', '#336791'),
('MySQL', '#4479A1'),
('Redis', '#DC382D'),
('Docker', '#2496ED'),
('Kubernetes', '#326CE5'),
('AWS', '#232F3E'),
('Git', '#F05032'),
('GraphQL', '#E10098'),
('Tailwind CSS', '#06B6D4'),
('Sass', '#CC6699'),
('Bootstrap', '#7952B3'),
('Firebase', '#FFCA28'),
('Supabase', '#3ECF8E'),
('Vercel', '#000000'),
('Netlify', '#00C7B7')
ON CONFLICT (name) DO NOTHING;