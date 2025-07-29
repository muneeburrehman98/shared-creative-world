import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { projectService } from '@/lib/project';
import { Plus, Image, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateProjectModalProps {
  onProjectCreated: () => void;
  children?: React.ReactNode;
}

export const CreateProjectModal = ({ onProjectCreated, children }: CreateProjectModalProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddTech = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setProjectImages([...projectImages, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setProjectImages(projectImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title and description for your project",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Upload images first
      const imageUrls: string[] = [];
      for (const image of projectImages) {
        const url = await projectService.uploadProjectImage(image);
        imageUrls.push(url);
      }

      // Create project
      await projectService.createProject({
        title,
        description,
        repo_url: repoUrl || undefined,
        technologies,
        image_urls: imageUrls
      });

      toast({
        title: "Project created",
        description: "Your project has been successfully created"
      });

      // Reset form
      setTitle('');
      setDescription('');
      setRepoUrl('');
      setTechnologies([]);
      setProjectImages([]);
      setOpen(false);
      
      // Notify parent
      onProjectCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="Enter project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL (optional)</Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technologies">Technologies</Label>
            <div className="flex space-x-2">
              <Input
                id="technologies"
                placeholder="Add a technology"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTech}>Add</Button>
            </div>
            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tech}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTech(tech)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-images">Project Images</Label>
            <div className="flex space-x-2">
              <Label htmlFor="project-image-upload" className="cursor-pointer flex-1">
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2" />
                    Add Images
                  </span>
                </Button>
              </Label>
              <Input
                id="project-image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            {projectImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {projectImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Project image ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};