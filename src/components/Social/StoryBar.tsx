import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { socialService } from '@/lib/social';
import { type Story } from '@/lib/social/types';
import { useAuth } from '@/hooks/use-auth';
import { Plus } from 'lucide-react';

export const StoryBar = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showAddStory, setShowAddStory] = useState(false);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const fetchedStories = await socialService.getStories();
      setStories(fetchedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const handleCreateStory = async () => {
    if (!storyFile) return;

    setLoading(true);
    try {
      const uploadedUrl = await socialService.uploadFile(storyFile, 'stories');
      
      const isVideo = storyFile.type.startsWith('video/');
      await socialService.createStory({
        image_url: isVideo ? undefined : uploadedUrl,
        video_url: isVideo ? uploadedUrl : undefined
      });

      toast({
        title: "Success",
        description: "Story created successfully!"
      });

      setStoryFile(null);
      setShowAddStory(false);
      loadStories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    return hoursLeft > 0 ? `${hoursLeft}h left` : 'Expired';
  };

  // Group stories by user
  const groupedStories = (stories as Story[]).reduce((acc, story) => {
    const key = story.user_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  return (
    <>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex-shrink-0">
          <Card className="relative w-20 h-28 cursor-pointer hover:scale-105 transition-transform">
            <div 
              className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg border-2 border-dashed border-primary/30"
              onClick={() => setShowAddStory(true)}
            >
              <Plus className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs text-center text-primary font-medium">Add Story</span>
            </div>
          </Card>
        </div>

        {/* Stories */}
        {Object.entries(groupedStories).map(([userId, userStories]) => {
          const latestStory = userStories[0]; // Show the latest story
          const hasMultiple = (userStories as Story[]).length > 1;
          
          return (
            <div key={userId} className="flex-shrink-0">
              <Card 
                className="relative w-20 h-28 cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                onClick={() => setSelectedStory(latestStory)}
              >
                {latestStory.image_url ? (
                  <img 
                    src={latestStory.image_url} 
                    alt="Story" 
                    className="w-full h-full object-cover"
                  />
                ) : latestStory.video_url ? (
                  <video 
                    src={latestStory.video_url} 
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs">{latestStory.content}</span>
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Profile picture */}
                <Avatar className="absolute top-2 left-2 h-8 w-8 border-2 border-white">
                  <AvatarImage src={latestStory.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {latestStory.profiles.display_name?.charAt(0) || latestStory.profiles.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Username and time */}
                <div className="absolute bottom-1 left-1 right-1">
                  <p className="text-white text-xs font-semibold truncate">
                    {latestStory.profiles.display_name || latestStory.profiles.username}
                  </p>
                  <p className="text-white/80 text-xs">
                    {formatTimeLeft(latestStory.expires_at)}
                  </p>
                </div>

                {/* Multiple stories indicator */}
                {hasMultiple && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {(userStories as Story[]).length}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-md h-[80vh] p-0">
          {selectedStory && (
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
              {selectedStory.image_url ? (
                <img 
                  src={selectedStory.image_url} 
                  alt="Story" 
                  className="w-full h-full object-contain"
                />
              ) : selectedStory.video_url ? (
                <video 
                  src={selectedStory.video_url} 
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <p className="text-white text-lg text-center px-4">{selectedStory.content}</p>
                </div>
              )}
              
              {/* Story header */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={selectedStory.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedStory.profiles.display_name?.charAt(0) || selectedStory.profiles.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {selectedStory.profiles.display_name || selectedStory.profiles.username}
                    </p>
                    <p className="text-white/80 text-xs">
                      {formatTimeLeft(selectedStory.expires_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Story Modal */}
      <Dialog open={showAddStory} onOpenChange={setShowAddStory}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Add to Your Story</h2>
            
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setStoryFile(e.target.files?.[0] || null)}
              />
            </div>

            {storyFile && (
              <div className="rounded-lg overflow-hidden border">
                {storyFile.type.startsWith('video/') ? (
                  <video 
                    src={URL.createObjectURL(storyFile)} 
                    controls 
                    className="w-full h-auto max-h-64"
                  />
                ) : (
                  <img 
                    src={URL.createObjectURL(storyFile)} 
                    alt="Story preview" 
                    className="w-full h-auto max-h-64 object-cover"
                  />
                )}
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddStory(false);
                  setStoryFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateStory}
                disabled={!storyFile || loading}
              >
                {loading ? 'Creating...' : 'Share Story'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};