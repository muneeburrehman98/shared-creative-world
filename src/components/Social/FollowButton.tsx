import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Clock } from 'lucide-react';
import { useFollow } from '@/hooks/use-follow';

interface FollowButtonProps {
  userId: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
}

export const FollowButton = ({ userId, size = 'default', variant = 'default' }: FollowButtonProps) => {
  const { followStatus, isLoading, checkFollowStatus, followUser, unfollowUser } = useFollow(userId);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleClick = () => {
    if (followStatus === 'not_following') {
      followUser();
    } else {
      unfollowUser();
    }
  };

  const getButtonContent = () => {
    switch (followStatus) {
      case 'following':
        return (
          <>
            <UserMinus className="w-4 h-4 mr-2" />
            Following
          </>
        );
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </>
        );
      default:
        return (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Follow
          </>
        );
    }
  };

  const getButtonVariant = () => {
    if (followStatus === 'following') return 'outline';
    if (followStatus === 'pending') return 'secondary';
    return variant;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant={getButtonVariant()}
      className="min-w-[100px]"
    >
      {getButtonContent()}
    </Button>
  );
};