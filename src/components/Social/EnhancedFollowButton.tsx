import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Clock, Check, X, Settings } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useFollow } from '@/hooks/use-follow';
import { followService } from '@/lib/follow';
import { useToast } from '@/hooks/use-toast';

interface EnhancedFollowButtonProps {
  userId: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  showDropdown?: boolean;
}

export const EnhancedFollowButton = ({ 
  userId, 
  size = 'default', 
  variant = 'default',
  showDropdown = true 
}: EnhancedFollowButtonProps) => {
  const { followStatus, isLoading, checkFollowStatus, followUser, unfollowUser } = useFollow(userId);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleMainAction = () => {
    if (followStatus === 'not_following') {
      followUser();
    } else {
      unfollowUser();
    }
  };

  const handleBlock = async () => {
    try {
      // This would need a block service implementation
      setIsBlocked(true);
      toast({
        title: 'User blocked',
        description: 'You will no longer see posts from this user.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to block user',
        variant: 'destructive',
      });
    }
  };

  const handleMute = async () => {
    try {
      // This would need a mute service implementation
      setIsMuted(true);
      toast({
        title: 'User muted',
        description: 'You will no longer see posts from this user in your feed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mute user',
        variant: 'destructive',
      });
    }
  };

  const getButtonContent = () => {
    if (isBlocked) {
      return (
        <>
          <X className="w-4 h-4 mr-2" />
          Blocked
        </>
      );
    }

    switch (followStatus) {
      case 'following':
        return (
          <>
            <Check className="w-4 h-4 mr-2" />
            Following
          </>
        );
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Requested
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
    if (isBlocked) return 'destructive';
    if (followStatus === 'following') return 'outline';
    if (followStatus === 'pending') return 'secondary';
    return variant;
  };

  if (!showDropdown) {
    return (
      <Button
        onClick={handleMainAction}
        disabled={isLoading || isBlocked}
        size={size}
        variant={getButtonVariant()}
        className="min-w-[100px]"
      >
        {getButtonContent()}
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      <Button
        onClick={handleMainAction}
        disabled={isLoading || isBlocked}
        size={size}
        variant={getButtonVariant()}
        className="min-w-[100px] rounded-r-none border-r-0"
      >
        {getButtonContent()}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={getButtonVariant()}
            size={size}
            className="px-2 rounded-l-none"
            disabled={isBlocked}
          >
            <Settings className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {followStatus === 'following' && (
            <>
              <DropdownMenuItem onClick={handleMute}>
                {isMuted ? 'Unmute' : 'Mute'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={unfollowUser}>
                <UserMinus className="w-4 h-4 mr-2" />
                Unfollow
              </DropdownMenuItem>
            </>
          )}
          {followStatus === 'pending' && (
            <DropdownMenuItem onClick={unfollowUser}>
              <X className="w-4 h-4 mr-2" />
              Cancel Request
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleBlock} className="text-destructive">
            <X className="w-4 h-4 mr-2" />
            Block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};