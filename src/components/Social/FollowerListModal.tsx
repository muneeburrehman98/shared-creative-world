import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, UserMinus, Clock, Check, X } from 'lucide-react';
import { followService } from '@/lib/follow';
import { supabase } from '@/integrations/supabase/client';
import { FollowButton } from './FollowButton';
import { useToast } from '@/hooks/use-toast';

interface FollowerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'followers' | 'following' | 'requests';
}

interface FollowData {
  follower_id?: string;
  following_id?: string;
  status: string;
  profile: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  } | null;
  created_at?: string;
}

export const FollowerListModal = ({ isOpen, onClose, userId, initialTab = 'followers' }: FollowerListModalProps) => {
  const [followers, setFollowers] = useState<FollowData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FollowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Load all data
      const [followersData, followingData, requestsData] = await Promise.all([
        followService.getFollowers(userId),
        followService.getFollowing(userId),
        userId === user?.id ? followService.getPendingRequests() : Promise.resolve([])
      ]);

      setFollowers(followersData);
      setFollowing(followingData);
      setPendingRequests(requestsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load follow data';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (followerId: string) => {
    try {
      await followService.acceptFollowRequest(followerId);
      await loadData(); // Refresh data
      toast({
        title: 'Request accepted',
        description: 'Follow request has been accepted.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (followerId: string) => {
    try {
      await followService.rejectFollowRequest(followerId);
      await loadData(); // Refresh data
      toast({
        title: 'Request rejected',
        description: 'Follow request has been rejected.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const renderUserCard = (item: FollowData, showFollowButton = true, showRequestActions = false) => {
    if (!item.profile) return null;

    return (
      <Card key={item.profile.user_id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={item.profile.avatar_url || ''} />
                <AvatarFallback>
                  {item.profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{item.profile.display_name}</h4>
                <p className="text-sm text-muted-foreground">@{item.profile.username}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showRequestActions && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(item.follower_id!)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(item.follower_id!)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              
              {showFollowButton && currentUserId !== item.profile.user_id && (
                <FollowButton userId={item.profile.user_id} size="sm" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Follow List</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            {currentUserId === userId && (
              <TabsTrigger value="requests">
                Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="overflow-y-auto max-h-[400px] mt-4">
            <TabsContent value="followers" className="space-y-2">
              {loading ? (
                <div className="text-center py-4">Loading followers...</div>
              ) : followers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No followers yet
                </div>
              ) : (
                followers.map((follower) => renderUserCard(follower, true, false))
              )}
            </TabsContent>

            <TabsContent value="following" className="space-y-2">
              {loading ? (
                <div className="text-center py-4">Loading following...</div>
              ) : following.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Not following anyone yet
                </div>
              ) : (
                following.map((follow) => renderUserCard(follow, true, false))
              )}
            </TabsContent>

            {currentUserId === userId && (
              <TabsContent value="requests" className="space-y-2">
                {loading ? (
                  <div className="text-center py-4">Loading requests...</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No pending requests
                  </div>
                ) : (
                  pendingRequests.map((request) => renderUserCard(request, false, true))
                )}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};