import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention';
  actor_id: string;
  target_id?: string;
  post_id?: string;
  read: boolean;
  created_at: string;
  actor: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content?: string;
    image_url?: string;
  };
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => loadNotifications()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // This would require a notifications table - we'll simulate with follow requests for now
      const { data: followRequests } = await supabase
        .from('follows')
        .select('id, follower_id, created_at')
        .eq('following_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Get profiles for follow requests
      let mockNotifications: Notification[] = [];
      if (followRequests && followRequests.length > 0) {
        const followerIds = followRequests.map(r => r.follower_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', followerIds);

        // Convert follow requests to notifications format
        mockNotifications = followRequests.map(request => {
          const profile = profiles?.find(p => p.user_id === request.follower_id);
          
          return {
            id: request.id,
            type: 'follow_request' as const,
            actor_id: request.follower_id,
            read: false,
            created_at: request.created_at,
            actor: {
              username: profile?.username || '',
              display_name: profile?.display_name || '',
              avatar_url: profile?.avatar_url
            }
          };
        });
      }

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read and navigate
    if (notification.type === 'follow_request') {
      navigate(`/user/${notification.actor.username}`);
    } else if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
      case 'follow_request': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'mention': return <AtSign className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.actor.display_name} liked your post`;
      case 'comment':
        return `${notification.actor.display_name} commented on your post`;
      case 'follow':
        return `${notification.actor.display_name} started following you`;
      case 'follow_request':
        return `${notification.actor.display_name} requested to follow you`;
      case 'mention':
        return `${notification.actor.display_name} mentioned you in a post`;
      default:
        return 'New notification';
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted cursor-pointer transition-colors ${
                    !notification.read ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notification.actor.avatar_url} />
                      <AvatarFallback>
                        {notification.actor.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm font-medium truncate">
                          {getNotificationText(notification)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};