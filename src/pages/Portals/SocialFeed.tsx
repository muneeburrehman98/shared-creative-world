import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, Users, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/Social/PostCard';
import { CreatePostModal } from '@/components/Social/CreatePostModal';
import { StoryBar } from '@/components/Social/StoryBar';
import { UserSearchModal } from '@/components/Social/UserSearchModal';
import { UserProfileButton } from '@/components/Social/UserProfileButton';
import { socialService, Post } from '@/lib/social';
import { useAuth } from '@/hooks/use-auth';
import { useSocialRedirect } from '@/hooks/use-social-redirect';

const SocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Redirect if user doesn't have a social profile
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
      setLoading(true);
      const fetchedPosts = await socialService.getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading social feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-lg">Social Feed</h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/portals/social')}>
                <Home className="h-4 w-4" />
              </Button>
              <UserSearchModal>
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </UserSearchModal>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portals/following')}>
                <Users className="h-4 w-4" />
              </Button>
              <UserProfileButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stories */}
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3">Stories</h2>
          <StoryBar />
        </div>

        {/* Create Post */}
        <div className="mb-6">
          <CreatePostModal onPostCreated={handlePostCreated} />
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">Posts Feed</h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={() => handlePostDeleted(post.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4">
        <div className="flex justify-around items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portals/social')}>
            <Home className="h-5 w-5" />
          </Button>
          <UserSearchModal>
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5" />
            </Button>
          </UserSearchModal>
          <Button variant="ghost" size="sm" onClick={() => navigate('/portals/following')}>
            <Users className="h-5 w-5" />
          </Button>
          <UserProfileButton size="sm" />
        </div>
      </nav>
    </div>
  );
};

export default SocialFeed;