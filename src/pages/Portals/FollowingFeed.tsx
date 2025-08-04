import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PostCard } from '@/components/Social/PostCard';
import { supabase } from '@/integrations/supabase/client';
import type { Post } from '@/lib/social/types';
import { useToast } from '@/hooks/use-toast';

export const FollowingFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<unknown>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate('/auth/signin');
        return;
      }
      setUser(user);
      loadFollowingPosts();
    };

    checkAuth();
  }, [navigate]);

  const loadFollowingPosts = async () => {
    try {
      setLoading(true);

      // Get list of users the current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', (user as any)?.id)
        .eq('status', 'accepted');

      if (followingError) throw followingError;

      if (!followingData || followingData.length === 0) {
        setPosts([]);
        return;
      }

      const followingIds = followingData.map(f => f.following_id);

      // Get posts from followed users
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', followingIds)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Manually fetch profile data for posts
      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', post.user_id)
            .single();

          return {
            ...post,
            profiles: profile || { username: '', display_name: '', avatar_url: null }
          };
        })
      );

      setPosts(postsWithProfiles as Post[]);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to load following posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading following feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/portals/social')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h1 className="font-semibold">Following</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No posts from following</h3>
              <p className="text-muted-foreground mb-4">
                Follow some users to see their posts here, or they haven't posted anything yet.
              </p>
              <Button onClick={() => navigate('/portals/social')}>
                Discover People
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={() => handlePostDeleted(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};