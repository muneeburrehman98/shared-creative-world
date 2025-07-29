import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { socialService, Post } from '@/lib/social';
import { Plus, Image, Video, X, Globe, Lock, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreatePostModalProps {
  onPostCreated?: (post: Post) => void;
}

export const CreatePostModal = ({ onPostCreated }: CreatePostModalProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'followers-only'>('public');
  const [isVideo, setIsVideo] = useState(false); // Add this line
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsVideo(file.type.startsWith('video/')); // Add this line
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setIsVideo(false); // Add this line
  };

  // Update handleSubmit to include visibility
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedFile) {
      toast({
        title: "Error",
        description: "Please add some content or upload a file",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const isVideo = selectedFile.type.startsWith('video/');
        const bucket = isVideo ? 'social-videos' : 'social-images';
        const uploadedUrl = await socialService.uploadFile(selectedFile, bucket);
        
        if (isVideo) {
          videoUrl = uploadedUrl;
        } else {
          imageUrl = uploadedUrl;
        }
      }

      // Create post with visibility
      const post = await socialService.createPost({
        content: content.trim() || undefined,
        image_url: imageUrl,
        video_url: videoUrl,
        is_private: visibility === 'private',
        visibility: visibility
      });

      toast({
        title: "Success",
        description: "Post created successfully!"
      });

      // Reset form
      setContent('');
      setVisibility('public');
      clearFile();
      setOpen(false);
      if (onPostCreated && post) {
        onPostCreated(post);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Add visibility selection UI
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          {filePreview && (
            <div className="relative rounded-lg overflow-hidden border">
              {isVideo ? (
                <video 
                  src={filePreview} 
                  controls 
                  className="w-full h-auto max-h-64 object-cover"
                />
              ) : (
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="w-full h-auto max-h-64 object-cover"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2" />
                    Add Photo
                  </span>
                </Button>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="visibility">Post Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value: 'public' | 'private' | 'followers-only') => setVisibility(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Public
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Private
                  </div>
                </SelectItem>
                <SelectItem value="followers-only">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Followers Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {visibility === 'public' && 'Anyone can see this post'}
              {visibility === 'private' && 'Only you can see this post'}
              {visibility === 'followers-only' && 'Only your followers can see this post'}
            </p>
          </div>

          {/* Remove the old private switch since we now have visibility selection */}
          {/* <div className="flex items-center space-x-2">
            <Switch
              id="private-post"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private-post" className="text-sm">
              Private post (only you can see this)
            </Label>
          </div> */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || (!content.trim() && !selectedFile)}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};