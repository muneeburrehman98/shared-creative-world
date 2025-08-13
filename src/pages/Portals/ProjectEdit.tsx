import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { projectService, type Project, type ProjectFile } from '@/lib/project';
import { ProjectSettings } from '@/components/Projects/ProjectSettings';
import { ReadmeEditor } from '@/components/Projects/ReadmeEditor';
import { FileManager } from '@/components/Projects/FileManager';
import { ArrowLeft, Settings, FileText, Folder } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    if (!id) return;
    
    const loadProject = async () => {
      try {
        const fetchedProject = await projectService.getProjectById(id);
        setProject(fetchedProject);
        
        // Check if user owns this project
        if (fetchedProject.user_id !== user?.id) {
          toast({
            title: "Access denied",
            description: "You don't have permission to edit this project",
            variant: "destructive"
          });
          navigate(`/projects/${id}`);
          return;
        }
        
        // Load project files
        const projectFiles = await projectService.getProjectFiles(id);
        setFiles(projectFiles);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive"
        });
        navigate('/portals/projects');
      } finally {
        setLoading(false);
      }
    };
    
    loadProject();
  }, [id, navigate, toast, user?.id]);

  const handleProjectUpdate = async () => {
    if (!id) return;
    try {
      const updatedProject = await projectService.getProjectById(id);
      setProject(updatedProject);
      toast({
        title: "Project updated",
        description: "Your project has been successfully updated",
      });
    } catch (error) {
      console.error('Failed to refresh project:', error);
    }
  };

  const handleReadmeSave = async (content: string) => {
    if (!project) return;
    try {
      await projectService.updateProject(project.id, { readme_content: content });
      const updatedProject = await projectService.getProjectById(project.id);
      setProject(updatedProject);
      toast({
        title: "README updated",
        description: "Your project README has been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update README",
        variant: "destructive"
      });
    }
  };

  const handleFilesChange = async () => {
    if (!id) return;
    try {
      const projectFiles = await projectService.getProjectFiles(id);
      setFiles(projectFiles);
    } catch (error) {
      console.error('Failed to refresh files:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Project not found</p>
          <Button 
            variant="link" 
            onClick={() => navigate('/portals/projects')}
            className="mt-4"
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <h1 className="text-lg font-semibold">Edit Project: {project.title}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="readme" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  README
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Files
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="settings">
                  <ProjectSettings 
                    project={project} 
                    onUpdate={handleProjectUpdate}
                  />
                </TabsContent>

                <TabsContent value="readme">
                  <ReadmeEditor 
                    content={project.readme_content || ''} 
                    onSave={handleReadmeSave}
                    canEdit={true}
                  />
                </TabsContent>

                <TabsContent value="files">
                  <FileManager 
                    projectId={project.id}
                    files={files}
                    onFilesChange={handleFilesChange}
                    canEdit={true}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectEdit;