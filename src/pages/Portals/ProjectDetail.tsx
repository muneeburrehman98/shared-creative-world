import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { projectService, type Project } from '@/lib/project';
import { Star, GitFork, ArrowLeft, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);

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
                
                {project.repo_url && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.repo_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Repository
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.technologies.map((tech, index) => (
                <Badge key={index} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
            
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p>{project.description}</p>
            </div>
            
            {project.image_urls && project.image_urls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.image_urls.map((url, index) => (
                  <div key={index} className="rounded-lg overflow-hidden">
                    <img 
                      src={url} 
                      alt={`${project.title} screenshot ${index + 1}`} 
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetail;