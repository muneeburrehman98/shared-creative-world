import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { projectService, type Project, type ProjectFile } from '@/lib/project';
import { FileManager } from '@/components/Projects/FileManager';
import { Star, GitFork, ArrowLeft, ExternalLink, Edit, Trash2, Download, FileText, Folder, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id) return;
    
    const loadProject = async () => {
      try {
        const fetchedProject = await projectService.getProjectById(id);
        setProject(fetchedProject);
        setStarCount(fetchedProject.stars_count);
        
        // Check if the project is starred by the current user
        const starred = await projectService.checkStar(id);
        setIsStarred(starred);
        
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
  }, [id, navigate, toast]);

  const handleToggleStar = async () => {
    if (!project) return;
    
    try {
      const starred = await projectService.toggleStar(project.id);
      setIsStarred(starred);
      setStarCount(prev => starred ? prev + 1 : prev - 1);
      
      toast({
        title: starred ? "Project starred" : "Star removed",
        description: starred ? "Added to your starred projects" : "Removed from your starred projects",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to star project",
        variant: "destructive"
      });
    }
  };

  const handleForkProject = async () => {
    if (!project) return;
    
    try {
      const forkedProject = await projectService.forkProject(project.id);
      
      toast({
        title: "Project forked",
        description: "Project has been forked to your account",
      });
      
      navigate(`/projects/${forkedProject.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fork project",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    
    try {
      await projectService.deleteProject(project.id);
      toast({
        title: "Project deleted",
        description: "Your project has been deleted",
      });
      navigate('/portals/projects');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    if (!project) return;
    
    try {
      await projectService.downloadProject(project.id);
      toast({
        title: "Download started",
        description: "Project download has been tracked",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track download",
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

  const isOwner = user?.id === project.user_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portals/projects')}
            className="mr-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          {isOwner && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/projects/${project.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your project.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={project.profiles.avatar_url || ''} />
                  <AvatarFallback>{project.profiles.display_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    By {project.profiles.display_name || project.profiles.username} • 
                    {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant={isStarred ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleStar}
                >
                  <Star className={`h-4 w-4 mr-2 ${isStarred ? 'fill-current' : ''}`} />
                  Star ({starCount})
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleForkProject}
                >
                  <GitFork className="h-4 w-4 mr-2" />
                  Fork ({project.forks_count})
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download ({project.downloads_count || 0})
                </Button>
                
                {project.github_url && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.github_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    GitHub
                  </Button>
                )}
                
                {project.live_url && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.live_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Live Demo
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="readme" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  README
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Files ({files.length})
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                    
                    {project.image_urls && project.image_urls.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.image_urls.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden border">
                            <img 
                              src={url} 
                              alt={`${project.title} screenshot ${index + 1}`} 
                              className="w-full h-auto"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {project.license && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>License:</span>
                        <Badge variant="outline">{project.license}</Badge>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="readme">
                  <div className="prose dark:prose-invert max-w-none">
                    {project.readme_content ? (
                      <div className="whitespace-pre-wrap border rounded-lg p-4 bg-muted/50">
                        {project.readme_content}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No README available for this project.</p>
                        {isOwner && (
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => navigate(`/projects/${project.id}/edit`)}
                          >
                            Add README
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="files">
                  <FileManager 
                    projectId={project.id}
                    files={files}
                    onFilesChange={handleFilesChange}
                    canEdit={isOwner}
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

export default ProjectDetail;