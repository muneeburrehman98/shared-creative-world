import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  repo_url?: string;
  technologies: string[];
  image_urls: string[];
  stars_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Technology {
  id: string;
  name: string;
  color: string;
}

export const projectService = {
  // Projects CRUD
  async getProjects(filter?: string): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_user_id_fkey(username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });
      
    if (filter) {
      query = query.contains('technologies', [filter]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as Project[]) || [];
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
    return data as Project;
  },

  async createProject(project: {
    title: string;
    description: string;
    repo_url?: string;
    technologies: string[];
    image_urls: string[];
  }) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, user_id: (await supabase.auth.getUser()).data.user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: {
    title?: string;
    description?: string;
    repo_url?: string;
    technologies?: string[];
    image_urls?: string[];
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

    // Check if star exists
    const { data: existingStar } = await supabase
      .from('project_stars')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.data.user.id)
      .single();

    if (existingStar) {
      // Unstar
      const { error } = await supabase
        .from('project_stars')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.data.user.id);

      if (error) throw error;
      return false;
    } else {
      // Star
      const { error } = await supabase
        .from('project_stars')
        .insert([{ project_id: projectId, user_id: user.data.user.id }]);

      if (error) throw error;
      return true;
    }
  },

  async checkStar(projectId: string): Promise<boolean> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return false;

    const { data } = await supabase
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

  // Technologies
  async getTechnologies(): Promise<Technology[]> {
    const { data, error } = await supabase
      .from('technologies')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Technology[];
  }
};