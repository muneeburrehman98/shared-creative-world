import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useSocialRedirect } from '@/hooks/use-social-redirect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { socialService, type Post } from '@/lib/social';
import { PostCard } from '@/components/Social/PostCard';
import { CreatePostModal } from '@/components/Social/CreatePostModal';
import { StoryBar } from '@/components/Social/StoryBar';
import { Home, Users, Search, Heart, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { UserSearchModal } from '@/components/Social/UserSearchModal';

const SocialFeed = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check if user needs to complete social profile setup
  useSocialRedirect();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/signin');
      return;
    }

    if (user) {
      loadPosts();
    }
  }, [user, authLoading, navigate]);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await socialService.getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    loadPosts();
  };

  const handlePostDeleted = () => {
    loadPosts();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your feed...</p>
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
          
          <h1 className="text-xl font-bold gradient-text">SocialHub</h1>
          
          <div className="flex items-center space-x-2">
            <UserSearchModal />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/portals/following')}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // Navigate to current user's profile
                socialService.getProfile().then(profile => {
                  if (profile?.username) {
                    navigate(`/user/${profile.username}`);
                  }
                });
              }}
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Stories Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <StoryBar />
          </CardContent>
        </Card>

        {/* Create Post Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <CreatePostModal onPostCreated={handlePostCreated} />
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share something with the community!
                </p>
                <CreatePostModal onPostCreated={handlePostCreated} />
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handlePostDeleted}
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
          <UserSearchModal>
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5" />
            </Button>
          </UserSearchModal>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/portals/following')}
          >
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <Heart className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              socialService.getProfile().then(profile => {
                if (profile?.username) {
                  navigate(`/user/${profile.username}`);
                }
              });
            }}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default SocialFeed;