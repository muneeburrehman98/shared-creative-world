import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, GitFork, ExternalLink, Trash2, Edit, Download, Eye } from 'lucide-react';
import { Project, projectService } from '@/lib/project';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onDelete: () => void;
}

export const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(project.stars_count);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.id === project.user_id;

  const handleViewProject = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleForkProject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    try {
      setLoading(true);
      await projectService.forkProject(project.id);
      
      toast({
        title: "Project forked",
        description: "Project has been forked to your account",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fork project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(project.id);
      toast({
        title: "Project deleted",
        description: "Your project has been deleted",
      });
      onDelete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const handleEditProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}/edit`);
  };

  // Check if the project is starred by the current user on component mount
  useState(() => {
    const checkStar = async () => {
      try {
        const starred = await projectService.checkStar(project.id);
        setIsStarred(starred);
      } catch (error) {
        console.error("Failed to check star status", error);
      }
    };
    
    checkStar();
  });

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={handleViewProject}
    >
      {project.image_urls && project.image_urls.length > 0 && (
        <div className="h-48 overflow-hidden">
          <img 
            src={project.image_urls[0]} 
            alt={project.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.profiles.avatar_url || ''} />
              <AvatarFallback>{project.profiles.display_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{project.profiles.display_name || project.profiles.username}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
          </span>
        </div>
        
        <h3 className="text-lg font-bold mb-2 line-clamp-1">{project.title}</h3>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {project.technologies.map((tech, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto hover:bg-transparent"
            onClick={handleToggleStar}
          >
            <Star className={`h-4 w-4 mr-1 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            <span>{starCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto hover:bg-transparent"
            onClick={handleForkProject}
          >
            <GitFork className="h-4 w-4 mr-1" />
            <span>{project.forks_count}</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-auto hover:bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4 mr-1" />
            <span>{project.downloads_count || 0}</span>
          </Button>

          {project.is_private && (
            <Badge variant="secondary" className="text-xs">
              Private
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {(project.github_url || project.live_url) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                if (project.github_url) {
                  window.open(project.github_url, '_blank');
                } else if (project.live_url) {
                  window.open(project.live_url, '_blank');
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          
          {isOwner && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-auto"
                onClick={handleEditProject}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};