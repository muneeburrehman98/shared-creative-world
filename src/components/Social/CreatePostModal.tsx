import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { socialService } from '@/lib/social';
import { Plus, Image, Video, X } from 'lucide-react';

interface CreatePostModalProps {
  onPostCreated?: () => void;
}

export const CreatePostModal = ({ onPostCreated }: CreatePostModalProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
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
  };

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

      // Create post
      await socialService.createPost({
        content: content.trim() || undefined,
        image_url: imageUrl,
        video_url: videoUrl,
        is_private: isPrivate
      });

      toast({
        title: "Success",
        description: "Post created successfully!"
      });

      // Reset form
      setContent('');
      setIsPrivate(false);
      clearFile();
      setOpen(false);
      onPostCreated?.();
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

  const isVideo = selectedFile?.type.startsWith('video/');

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

          <div className="flex items-center space-x-2">
            <Switch
              id="private-post"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private-post" className="text-sm">
              Private post (only you can see this)
            </Label>
          </div>

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