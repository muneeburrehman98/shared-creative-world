import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FollowerCountModal } from '@/components/Social/FollowerCountModal';
import { ArrowLeft, MapPin, Calendar, Phone, Building, Lock, Edit } from 'lucide-react';
import { EnhancedFollowButton } from '@/components/Social/EnhancedFollowButton';
import { PostCard } from '@/components/Social/PostCard';
import { Post } from '@/lib/social/types';
import { socialService } from '@/lib/social';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  department?: string;
  phone_number?: string;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;

      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Find user by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) {
          toast({
            title: 'User not found',
            description: 'The requested user profile could not be found.',
            variant: 'destructive',
          });
          return;
        }

        setProfile(profileData as UserProfile);

        // Load posts if profile is public or user is viewing their own profile
        if (!profileData.is_private || profileData.user_id === user?.id) {
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey(username, display_name, avatar_url)
            `)
            .eq('user_id', profileData.user_id)
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
        }
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: (error as Error).message || 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, toast]);

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The user profile you're looking for doesn't exist.
            </p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.user_id;
  const canViewPosts = !profile.is_private || isOwnProfile;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
                  onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold">{profile.display_name}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="w-24 h-24 mx-auto sm:mx-0">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold">{profile.display_name}</h2>
                  {profile.is_private && (
                    <Badge variant="secondary">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-2">@{profile.username}</p>
                
                {profile.full_name && (
                  <p className="text-sm text-muted-foreground mb-2">{profile.full_name}</p>
                )}

                {profile.bio && (
                  <p className="text-sm mb-4">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {profile.department && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {profile.department}
                    </div>
                  )}
                  {profile.phone_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profile.phone_number}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-6 mb-4">
                  <FollowerCountModal userId={profile.user_id} type="following">
                    <button className="text-center hover:bg-muted rounded-lg p-2 transition-colors">
                      <div className="font-semibold">{profile.following_count}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </button>
                  </FollowerCountModal>
                  <FollowerCountModal userId={profile.user_id} type="followers">
                    <button className="text-center hover:bg-muted rounded-lg p-2 transition-colors">
                      <div className="font-semibold">{profile.followers_count}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </button>
                  </FollowerCountModal>
                </div>

                {!isOwnProfile && (
                  <EnhancedFollowButton userId={profile.user_id} />
                )}
                {isOwnProfile && (
                  <Button
                    onClick={() => navigate('/portals/social/setup')}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="mb-6" />

        {/* Posts Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Posts</h3>
          
          {!canViewPosts ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-semibold mb-2">This account is private</h4>
                <p className="text-muted-foreground">
                  Follow this account to see their posts.
                </p>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No posts yet.</p>
              </CardContent>
            </Card>
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
    </div>
  );
};