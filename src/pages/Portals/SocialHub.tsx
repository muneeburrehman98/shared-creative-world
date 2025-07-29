import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, Users, Heart, User, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/Social/PostCard';
import { CreatePostModal } from '@/components/Social/CreatePostModal';
import { StoryBar } from '@/components/Social/StoryBar';
import { UserSearchModal } from '@/components/Social/UserSearchModal';
import { UserProfileButton } from '@/components/Social/UserProfileButton';
import { socialService, Post } from '@/lib/social';
import { useAuth } from '@/hooks/use-auth';
import { useSocialRedirect } from '@/hooks/use-social-redirect';

const SocialHub = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if user doesn't have a social profile
  useSocialRedirect();

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    
    loadFeeds();
  }, [user, navigate]);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      // Load public posts for home feed
      const publicPosts = await socialService.getPosts();
      setPosts(publicPosts);
      
      // Load following posts (will implement enhanced logic)
      const followingFeed = await socialService.getFollowingPosts();
      setFollowingPosts(followingFeed);
    } catch (error) {
      console.error('Error loading feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
    if (newPost.visibility !== 'private') {
      setFollowingPosts([newPost, ...followingPosts]);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
    setFollowingPosts(followingPosts.filter(post => post.id !== postId));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading SocialHub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SocialHub
            </h1>
            <div className="flex items-center space-x-2">
              <UserSearchModal>
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </UserSearchModal>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portals/social/nuets')}>
                <Play className="h-4 w-4" />
              </Button>
              <UserProfileButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stories */}
        <div className="mb-6">
          <StoryBar />
        </div>

        {/* Create Post */}
        <div className="mb-6">
          <CreatePostModal onPostCreated={handlePostCreated} />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Following
            </TabsTrigger>
            <TabsTrigger value="nuets" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Nuets
            </TabsTrigger>
          </TabsList>

          {/* Home Feed - Public Posts */}
          <TabsContent value="home" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Discover</h2>
              <p className="text-sm text-muted-foreground">Public posts from the community</p>
            </div>
            
            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-4">
                  <Heart className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <p className="text-lg mb-2">No posts yet</p>
                <p className="text-sm">Be the first to share something amazing!</p>
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
          </TabsContent>

          {/* Following Feed */}
          <TabsContent value="following" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Following</h2>
              <p className="text-sm text-muted-foreground">Posts from people you follow</p>
            </div>
            
            {followingPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-4">
                  <Users className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <p className="text-lg mb-2">No posts from following</p>
                <p className="text-sm mb-4">Follow some users to see their posts here</p>
                <UserSearchModal>
                  <Button variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Find People
                  </Button>
                </UserSearchModal>
              </div>
            ) : (
              followingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => handlePostDeleted(post.id)}
                />
              ))
            )}
          </TabsContent>

          {/* Nuets Preview */}
          <TabsContent value="nuets" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <div className="mb-4">
                <Play className="h-16 w-16 mx-auto text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Nuets</h2>
              <p className="text-muted-foreground mb-6">Short videos under 60 seconds</p>
              <Button onClick={() => navigate('/portals/social/nuets')} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Watch Nuets
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-4">
        <div className="flex justify-around items-center">
          <Button 
            variant={activeTab === 'home' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveTab('home')}
          >
            <Home className="h-5 w-5" />
          </Button>
          <UserSearchModal>
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5" />
            </Button>
          </UserSearchModal>
          <Button 
            variant={activeTab === 'following' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveTab('following')}
          >
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/portals/social/nuets')}>
            <Play className="h-5 w-5" />
          </Button>
          <UserProfileButton size="sm" />
        </div>
      </nav>
    </div>
  );
};

export default SocialHub;