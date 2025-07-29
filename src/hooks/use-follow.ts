import { useState, useCallback } from 'react';
import { followService } from '@/lib/follow';
import { useToast } from '@/hooks/use-toast';

export const useFollow = (userId: string) => {
  const [followStatus, setFollowStatus] = useState<'not_following' | 'pending' | 'following'>('not_following');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkFollowStatus = useCallback(async () => {
    try {
      const status = await followService.getFollowStatus(userId);
      setFollowStatus(status);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [userId]);

  const followUser = useCallback(async () => {
    setIsLoading(true);
    try {
      await followService.followUser(userId);
      const newStatus = await followService.getFollowStatus(userId);
      setFollowStatus(newStatus);
      
      if (newStatus === 'pending') {
        toast({
          title: 'Follow request sent',
          description: 'Your follow request has been sent and is pending approval.',
        });
      } else {
        toast({
          title: 'Following',
          description: 'You are now following this user.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to follow user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const unfollowUser = useCallback(async () => {
    setIsLoading(true);
    try {
      await followService.unfollowUser(userId);
      setFollowStatus('not_following');
      toast({
        title: 'Unfollowed',
        description: 'You are no longer following this user.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unfollow user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  return {
    followStatus,
    isLoading,
    checkFollowStatus,
    followUser,
    unfollowUser,
  };
};