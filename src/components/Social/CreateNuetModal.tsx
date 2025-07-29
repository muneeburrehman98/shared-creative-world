import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { socialService, Post } from '@/lib/social';
import { Plus, Video, X } from 'lucide-react';

interface CreateNuetModalProps {
  onNuetCreated?: (post: Post) => void;
  children?: React.ReactNode;
}

export const CreateNuetModal = ({ onNuetCreated, children }: CreateNuetModalProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Error",
          description: "Please select a video file",
          variant: "destructive"
        });
        return;
      }

      // Check video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (video.duration > 60) {
          toast({
            title: "Error",
            description: "Video must be 60 seconds or less",
            variant: "destructive"
          });
          return;
        }
        setSelectedVideo(file);
        setVideoPreview(URL.createObjectURL(file));
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const clearVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVideo) {
      toast({
        title: "Error",
        description: "Please select a video",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const videoUrl = await socialService.uploadFile(selectedVideo, 'social-videos');
      
      const post = await socialService.createPost({
        content: content.trim() || undefined,
        video_url: videoUrl,
        is_private: false,
        visibility: 'public'
      });

      toast({
        title: "Success",
        description: "Nuet created successfully!"
      });

      setContent('');
      clearVideo();
      setOpen(false);
      if (onNuetCreated && post) {
        onNuetCreated(post);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create Nuet",
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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Nuet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Nuet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Caption (optional)</Label>
            <Textarea
              id="content"
              placeholder="Add a caption to your Nuet..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
            />
          </div>

          {videoPreview ? (
            <div className="relative rounded-lg overflow-hidden border aspect-[9/16]">
              <video
                src={videoPreview}
                controls
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearVideo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex-1">
              <Label htmlFor="video-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Video className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">Upload a video</p>
                  <p className="text-xs text-muted-foreground">60 seconds or less</p>
                </div>
              </Label>
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
            </div>
          )}

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
              disabled={loading || !selectedVideo}
            >
              {loading ? 'Creating...' : 'Create Nuet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};