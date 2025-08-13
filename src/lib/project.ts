import { supabase } from '@/integrations/supabase/client';

// Create a typed client for raw queries to work around type limitations
const rawSupabase = supabase as any;

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  repo_url?: string;
  github_url?: string;
  live_url?: string;
  technologies: string[];
  image_urls: string[];
  stars_count: number;
  forks_count: number;
  downloads_count: number;
  is_private: boolean;
  visibility: 'public' | 'private' | 'internal';
  readme_content?: string;
  license: string;
  created_at: string;
  updated_at: string;
  forked_from?: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  content_type?: string;
  file_url: string;
  created_at: string;
  updated_at: string;
}

export interface Technology {
  id: string;
  name: string;
  color: string;
}

export const projectService = {
  // Projects CRUD
  async getProjects(filter?: string, includePrivate = false): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_user_id_fkey(username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });
      
    // Note: is_private filter temporarily disabled until database types are updated
    // if (!includePrivate) {
    //   query = query.eq('is_private', false);
    // }
      
    if (filter) {
      query = query.contains('technologies', [filter]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as unknown as Project[]) || [];
  },

  async getProjectById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_user_id_fkey(username, display_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Project;
  },

  async createProject(project: {
    title: string;
    description: string;
    repo_url?: string;
    github_url?: string;
    live_url?: string;
    technologies: string[];
    image_urls: string[];
    is_private?: boolean;
    visibility?: 'public' | 'private' | 'internal';
    readme_content?: string;
    license?: string;
  }) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        ...project, 
        user_id: (await supabase.auth.getUser()).data.user?.id,
        is_private: project.is_private || false,
        visibility: project.visibility || 'public',
        license: project.license || 'MIT'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: {
    title?: string;
    description?: string;
    repo_url?: string;
    github_url?: string;
    live_url?: string;
    technologies?: string[];
    image_urls?: string[];
    is_private?: boolean;
    visibility?: 'public' | 'private' | 'internal';
    readme_content?: string;
    license?: string;
  }) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Star/Fork operations
  async toggleStar(projectId: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data: existingStar } = await rawSupabase
      .from('project_stars')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.data.user.id)
      .single();

    if (existingStar) {
      await rawSupabase
        .from('project_stars')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.data.user.id);
      
      await rawSupabase.rpc('decrement_star_count', { project_id: projectId });
      return false;
    } else {
      await rawSupabase
        .from('project_stars')
        .insert([{ project_id: projectId, user_id: user.data.user.id }]);
      
      await rawSupabase.rpc('increment_star_count', { project_id: projectId });
      return true;
    }
  },

  async checkStar(projectId: string): Promise<boolean> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return false;

    const { data } = await rawSupabase
      .from('project_stars')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.data.user.id)
      .single();

    return !!data;
  },

  async forkProject(projectId: string) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    // Get the original project
    const originalProject = await this.getProjectById(projectId);

    // Create a new project based on the original
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        user_id: user.data.user.id,
        title: `${originalProject.title} (Fork)`,
        description: originalProject.description,
        repo_url: originalProject.repo_url,
        technologies: originalProject.technologies,
        image_urls: originalProject.image_urls,
        forked_from: projectId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // File uploads
  async uploadProjectImage(file: File): Promise<string> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('project-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async uploadProjectFile(projectId: string, file: File, filePath: string): Promise<ProjectFile> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const fileName = `${projectId}/${filePath}`;

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName);

    const { data, error } = await rawSupabase
      .from('project_files')
      .insert([{
        project_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type.split('/')[0],
        content_type: file.type,
        file_url: urlData.publicUrl
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ProjectFile;
  },

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const { data, error } = await rawSupabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('file_path');

    if (error) throw error;
    return data || [];
  },

  async deleteProjectFile(fileId: string): Promise<void> {
    const { data: file, error: fetchError } = await rawSupabase
      .from('project_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError) throw fetchError;

    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([`${file.project_id}/${file.file_path}`]);

    if (storageError) throw storageError;

    const { error: dbError } = await rawSupabase
      .from('project_files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;
  },

  async downloadProject(projectId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    
    // Track download
    await rawSupabase
      .from('project_downloads')
      .insert([{
        project_id: projectId,
        user_id: user.data.user?.id,
        ip_address: null, // Would need to get from request in real app
        user_agent: navigator.userAgent
      }]);

    // Increment download count
    await rawSupabase.rpc('increment_download_count', { project_id: projectId });
  },

  // Technologies
  async getTechnologies(): Promise<Technology[]> {
    // Return predefined technologies until the database is updated
    return [
      { id: '1', name: 'React', color: '#61DAFB' },
      { id: '2', name: 'TypeScript', color: '#3178C6' },
      { id: '3', name: 'JavaScript', color: '#F7DF1E' },
      { id: '4', name: 'Node.js', color: '#339933' },
      { id: '5', name: 'Python', color: '#3776AB' },
    ];
  }
};