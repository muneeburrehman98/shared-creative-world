import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { socialService, type Post } from '@/lib/social';
import { useAuth } from '@/hooks/use-auth';
import { useSocialRedirect } from '@/hooks/use-social-redirect';
import { useToast } from '@/hooks/use-toast';
import { CreateNuetModal } from '@/components/Social/CreateNuetModal';

const Nuets = () => {
  const [videos, setVideos] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Use the social redirect hook to ensure user has a profile
  useSocialRedirect();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const posts = await socialService.getPosts();
      // Filter only posts with video content
      const videoContent = posts.filter(post => post.video_url);
      setVideos(videoContent);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Nuets...</p>
        </div>
      </div>
    );
  }

  const handleNuetCreated = (newPost: Post) => {
    setVideos([newPost, ...videos]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portals/social')}
              className="-ml-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Nuets
            </h1>
            <CreateNuetModal onNuetCreated={handleNuetCreated}>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </CreateNuetModal>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">No videos yet</h2>
            <p className="text-muted-foreground mb-6">Be the first to share a short video!</p>
            <CreateNuetModal onNuetCreated={handleNuetCreated}>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Nuet
              </Button>
            </CreateNuetModal>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="aspect-[9/16] bg-muted rounded-lg overflow-hidden">
                <video
                  src={video.video_url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Nuets;