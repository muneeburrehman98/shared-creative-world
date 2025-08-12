import { useState } from 'react';
import { Settings, Lock, Unlock, Globe, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { projectService, type Project } from '@/lib/project';

interface ProjectSettingsProps {
  project: Project;
  onUpdate: () => void;
}

const ProjectSettings = ({ project, onUpdate }: ProjectSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description,
    github_url: project.github_url || '',
    live_url: project.live_url || '',
    is_private: project.is_private,
    visibility: project.visibility,
    license: project.license,
    technologies: project.technologies || []
  });
  const [newTech, setNewTech] = useState('');
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await projectService.updateProject(project.id, formData);
      toast({
        title: "Success",
        description: "Project settings updated successfully",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addTechnology = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTech.trim()]
      }));
      setNewTech('');
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const getVisibilityIcon = () => {
    switch (formData.visibility) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'internal':
        return <Users className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Project Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project..."
            />
          </div>
        </div>

        {/* URLs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input
              id="github_url"
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
              placeholder="https://github.com/username/repository"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="live_url">Live Demo URL</Label>
            <Input
              id="live_url"
              type="url"
              value={formData.live_url}
              onChange={(e) => setFormData(prev => ({ ...prev, live_url: e.target.value }))}
              placeholder="https://your-project.com"
            />
          </div>
        </div>

        {/* Privacy & Visibility */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Private Project</Label>
              <p className="text-sm text-muted-foreground">
                Make this project visible only to you
              </p>
            </div>
            <Switch
              checked={formData.is_private}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ 
                  ...prev, 
                  is_private: checked,
                  visibility: checked ? 'private' : 'public'
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) => 
                setFormData(prev => ({ 
                  ...prev, 
                  visibility: value as 'public' | 'private' | 'internal',
                  is_private: value !== 'public'
                }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getVisibilityIcon()}
                    <span className="capitalize">{formData.visibility}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Public - Visible to everyone</span>
                  </div>
                </SelectItem>
                <SelectItem value="internal">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Internal - Visible to organization</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Private - Only visible to you</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* License */}
        <div className="space-y-2">
          <Label htmlFor="license">License</Label>
          <Select
            value={formData.license}
            onValueChange={(value) => setFormData(prev => ({ ...prev, license: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MIT">MIT License</SelectItem>
              <SelectItem value="Apache-2.0">Apache License 2.0</SelectItem>
              <SelectItem value="GPL-3.0">GNU General Public License v3.0</SelectItem>
              <SelectItem value="BSD-3-Clause">BSD 3-Clause License</SelectItem>
              <SelectItem value="ISC">ISC License</SelectItem>
              <SelectItem value="Unlicense">The Unlicense</SelectItem>
              <SelectItem value="Proprietary">Proprietary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Technologies */}
        <div className="space-y-4">
          <Label>Technologies</Label>
          <div className="flex gap-2">
            <Input
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Add a technology..."
              onKeyPress={(e) => e.key === 'Enter' && addTechnology()}
            />
            <Button onClick={addTechnology} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.technologies.map((tech) => (
              <Badge
                key={tech}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeTechnology(tech)}
              >
                {tech} ×
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export { ProjectSettings };