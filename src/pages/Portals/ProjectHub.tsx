import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { projectService, type Project } from '@/lib/project';
import { ProjectCard } from '@/components/Projects/ProjectCard';
import { CreateProjectModal } from '@/components/Projects/CreateProjectModal';
import { Home, Code, Search, Star, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ProjectHub = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const { toast } = useToast();

  const popularTechnologies = [
    { name: 'JavaScript', color: 'bg-yellow-500' },
    { name: 'Python', color: 'bg-blue-500' },
    { name: 'React', color: 'bg-cyan-500' },
    { name: 'Node.js', color: 'bg-green-500' },
    { name: 'TypeScript', color: 'bg-blue-700' },
    { name: 'Vue', color: 'bg-emerald-500' },
    { name: 'Angular', color: 'bg-red-500' },
    { name: 'PHP', color: 'bg-purple-500' },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/signin');
      return;
    }

    if (user) {
      loadProjects();
    }
  }, [user, authLoading, navigate, selectedTech]);

  const loadProjects = async () => {
    try {
      const fetchedProjects = await projectService.getProjects(selectedTech || undefined);
      setProjects(fetchedProjects);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    loadProjects();
  };

  const handleProjectDeleted = () => {
    loadProjects();
  };

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>
          
          <h1 className="text-xl font-bold gradient-text">Project Hub</h1>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/portals/social')}
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-1/2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search projects..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1 w-full md:w-auto">
                <CreateProjectModal onProjectCreated={handleProjectCreated} />
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={selectedTech === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTech(null)}
              >
                All
              </Badge>
              {popularTechnologies.map((tech) => (
                <Badge
                  key={tech.name}
                  variant={selectedTech === tech.name ? "default" : "outline"}
                  className={`cursor-pointer ${selectedTech === tech.name ? tech.color : ''}`}
                  onClick={() => setSelectedTech(selectedTech === tech.name ? null : tech.name)}
                >
                  {tech.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center">
                <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedTech 
                    ? `No projects found with ${selectedTech} technology. Try a different filter or create a new project.`
                    : 'Be the first to share a project with the community!'}
                </p>
                <CreateProjectModal onProjectCreated={handleProjectCreated} />
              </CardContent>
            </Card>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleProjectDeleted}
              />
            ))
          )}
        </div>

        {/* Bottom spacing */}
        <div className="h-20" />
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t sm:hidden">
        <div className="flex items-center justify-around h-16">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/portals/projects')}>
            <Code className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Star className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/portals/social')}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default ProjectHub;