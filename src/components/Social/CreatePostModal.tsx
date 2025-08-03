import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { socialService } from '@/lib/social';
import { Post } from '@/lib/social/types';
import { Plus, Image, Video, X, Globe, Lock, Users, Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaEditor } from './MediaEditor';
import { MediaMetadata } from '@/lib/social/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface CreatePostModalProps {
  onPostCreated?: (post: Post) => void;
}

export const CreatePostModal = ({ onPostCreated }: CreatePostModalProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'followers-only'>('public');
  const [isVideo, setIsVideo] = useState(false);
  const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(null);
  const [mediaMetadata, setMediaMetadata] = useState<(MediaMetadata | null)[]>([]);
  
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Check if any file is a video
    const hasVideo = files.some(file => file.type.startsWith('video/'));
    
    // If there's a video, only allow that single video
    if (hasVideo) {
      if (files.length > 1) {
        toast({
          title: "Only one video allowed",
          description: "You can only upload one video at a time",
          variant: "destructive"
        });
        return;
      }
      
      const videoFile = files[0];
      
      // Check video duration (requires loading the video)
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          toast({
            title: "Video too long",
            description: "Videos must be 60 seconds or less",
            variant: "destructive"
          });
          return;
        }
        
        setSelectedFiles([videoFile]);
        setIsVideo(true);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews([e.target?.result as string]);
          setMediaMetadata([null]);
        };
        reader.readAsDataURL(videoFile);
      };
      video.src = URL.createObjectURL(videoFile);
      return;
    }
    
    // For images, allow multiple (up to 10)
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please select image files",
        variant: "destructive"
      });
      return;
    }
    
    // Limit to 10 images
    const totalFiles = selectedFiles.length + imageFiles.length;
    if (totalFiles > 10) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 10 images",
        variant: "destructive"
      });
      return;
    }
    
    // Add the new files to the existing ones
    const newFiles = [...selectedFiles, ...imageFiles];
    setSelectedFiles(newFiles);
    setIsVideo(false);
    
    // Create previews for all new files
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => [...prev, e.target?.result as string]);
        setMediaMetadata(prev => [...prev, null]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
    setMediaMetadata(prev => prev.filter((_, i) => i !== index));
    
    if (selectedFiles.length === 1) {
      setIsVideo(false);
    }
  };
  
  const openMediaEditor = (index: number) => {
    setEditingMediaIndex(index);
  };
  
  const handleMediaSave = (editedUrl: string, metadata: MediaMetadata) => {
    if (editingMediaIndex === null) return;
    
    // In a real implementation, we would replace the preview with the edited image
    // For now, we'll just update the metadata
    setMediaMetadata(prev => {
      const newMetadata = [...prev];
      newMetadata[editingMediaIndex] = metadata;
      return newMetadata;
    });
    
    setEditingMediaIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add some content or upload files",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      let mediaUrls: string[] | undefined;

      // Upload files if selected
      if (selectedFiles.length > 0) {
        if (isVideo) {
          // Single video upload
          videoUrl = await socialService.uploadFile(selectedFiles[0], 'social-videos');
        } else if (selectedFiles.length === 1) {
          // Single image upload
          imageUrl = await socialService.uploadFile(selectedFiles[0], 'social-images');
        } else {
          // Multiple images upload (carousel)
          mediaUrls = [];
          for (const file of selectedFiles) {
            const url = await socialService.uploadFile(file, 'social-images');
            mediaUrls.push(url);
          }
        }
      }

      // Create post with visibility and media metadata
      const post = await socialService.createPost({
        content: content.trim() || undefined,
        image_url: imageUrl,
        video_url: videoUrl,
        media_urls: mediaUrls,
        media_metadata: mediaMetadata.filter(Boolean).length > 0 ? mediaMetadata[0] : undefined,
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
      setSelectedFiles([]);
      setFilePreviews([]);
      setMediaMetadata([]);
      setIsVideo(false);
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

          {filePreviews.length > 0 && (
            <div className="rounded-lg overflow-hidden border">
              {isVideo ? (
                <div className="relative">
                  <video 
                    src={filePreviews[0]} 
                    controls 
                    className="w-full h-auto max-h-64 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeFile(0)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : filePreviews.length === 1 ? (
                <div className="relative">
                  <img 
                    src={filePreviews[0]} 
                    alt="Preview" 
                    className="w-full h-auto max-h-64 object-cover"
                    style={{ filter: mediaMetadata[0]?.effects?.map(e => e.type === 'filter' ? e.name : '').join(' ') || '' }}
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openMediaEditor(0)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFile(0)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {filePreviews.map((preview, index) => (
                      <CarouselItem key={index}>
                        <div className="relative">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-64 object-cover"
                            style={{ filter: mediaMetadata[index]?.effects?.map(e => e.type === 'filter' ? e.name : '').join(' ') || '' }}
                          />
                          <div className="absolute top-2 right-2 flex space-x-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => openMediaEditor(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-background/80 rounded-full px-2 py-1">
                            <span className="text-xs">{index + 1}/{filePreviews.length}</span>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-4" />
                  <CarouselNext className="-right-4" />
                </Carousel>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2" />
                    Add Photos
                  </span>
                </Button>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                multiple={!isVideo}
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
              disabled={loading || (!content.trim() && selectedFiles.length === 0)}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Media Editor Dialog */}
      {editingMediaIndex !== null && filePreviews[editingMediaIndex] && (
        <MediaEditor
          open={editingMediaIndex !== null}
          onOpenChange={() => setEditingMediaIndex(null)}
          imageUrl={filePreviews[editingMediaIndex]}
          onSave={handleMediaSave}
        />
      )}
    </Dialog>
  );
};