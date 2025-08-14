import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus, Eye, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'view' | 'share';
  actor: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content?: string;
    image_url?: string;
  };
  created_at: string;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Combine and format activities
      let likeActivities: Activity[] = [];
      let commentActivities: Activity[] = [];
      let followActivities: Activity[] = [];

      // Get recent likes on user's posts (manual join)
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id);

      const postIds = userPosts?.map(p => p.id) || [];

      if (postIds.length > 0) {
        const { data: likes } = await supabase
          .from('likes')
          .select('id, created_at, user_id, post_id')
          .in('post_id', postIds)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        // Get profiles for likes
        if (likes && likes.length > 0) {
          const userIds = likes.map(l => l.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .in('user_id', userIds);

          // Get post details
          const { data: posts } = await supabase
            .from('posts')
            .select('id, content, image_url, user_id')
            .in('id', likes.map(l => l.post_id));

          likeActivities = (likes || []).map(like => {
            const profile = profiles?.find(p => p.user_id === like.user_id);
            const post = posts?.find(p => p.id === like.post_id);
            
            return {
              id: `like-${like.id}`,
              type: 'like' as const,
              actor: {
                user_id: like.user_id,
                username: profile?.username || '',
                display_name: profile?.display_name || '',
                avatar_url: profile?.avatar_url
              },
              post: post ? {
                id: post.id,
                content: post.content,
                image_url: post.image_url
              } : undefined,
              created_at: like.created_at
            };
          });
        }
      }

      // Get recent comments on user's posts (manual join)
      if (postIds.length > 0) {
        const { data: comments } = await supabase
          .from('comments')
          .select('id, created_at, user_id, post_id')
          .in('post_id', postIds)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        // Get profiles for comments
        if (comments && comments.length > 0) {
          const userIds = comments.map(c => c.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .in('user_id', userIds);

          // Get post details
          const { data: posts } = await supabase
            .from('posts')
            .select('id, content, image_url, user_id')
            .in('id', comments.map(c => c.post_id));

          commentActivities = (comments || []).map(comment => {
            const profile = profiles?.find(p => p.user_id === comment.user_id);
            const post = posts?.find(p => p.id === comment.post_id);
            
            return {
              id: `comment-${comment.id}`,
              type: 'comment' as const,
              actor: {
                user_id: comment.user_id,
                username: profile?.username || '',
                display_name: profile?.display_name || '',
                avatar_url: profile?.avatar_url
              },
              post: post ? {
                id: post.id,
                content: post.content,
                image_url: post.image_url
              } : undefined,
              created_at: comment.created_at
            };
          });
        }
      }

      // Get recent follows (manual join)
      const { data: follows } = await supabase
        .from('follows')
        .select('id, created_at, follower_id')
        .eq('following_id', user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(10);

      if (follows && follows.length > 0) {
        const userIds = follows.map(f => f.follower_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        followActivities = (follows || []).map(follow => {
          const profile = profiles?.find(p => p.user_id === follow.follower_id);
          
          return {
            id: `follow-${follow.id}`,
            type: 'follow' as const,
            actor: {
              user_id: follow.follower_id,
              username: profile?.username || '',
              display_name: profile?.display_name || '',
              avatar_url: profile?.avatar_url
            },
            created_at: follow.created_at
          };
        });
      }

      const allActivities: Activity[] = [
        ...likeActivities,
        ...commentActivities,
        ...followActivities
      ];

      // Sort by date
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setActivities(allActivities.slice(0, 30)); // Show latest 30 activities
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'view': return <Eye className="h-4 w-4 text-gray-500" />;
      case 'share': return <Share className="h-4 w-4 text-purple-500" />;
      default: return null;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'like':
        return `${activity.actor.display_name} liked your post`;
      case 'comment':
        return `${activity.actor.display_name} commented on your post`;
      case 'follow':
        return `${activity.actor.display_name} started following you`;
      case 'view':
        return `${activity.actor.display_name} viewed your profile`;
      case 'share':
        return `${activity.actor.display_name} shared your post`;
      default:
        return 'New activity';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.post) {
      // Navigate to post or open post modal
      // For now, navigate to user's profile
      navigate(`/user/${activity.actor.username}`);
    } else if (activity.type === 'follow') {
      navigate(`/user/${activity.actor.username}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">When people interact with your posts, you'll see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.actor.avatar_url} />
                    <AvatarFallback>
                      {activity.actor.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.created_at)}
                  </p>
                </div>

                {activity.post?.image_url && (
                  <img
                    src={activity.post.image_url}
                    alt="Post"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};