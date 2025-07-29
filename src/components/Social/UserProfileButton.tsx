import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { socialService } from '@/lib/social';
import { useEffect, useState } from 'react';

interface UserProfileButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const UserProfileButton = ({ variant = 'ghost', size = 'sm' }: UserProfileButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await socialService.getProfile();
        if (profile?.username) {
          setUsername(profile.username);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const handleClick = () => {
    if (username) {
      navigate(`/user/${username}`);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleClick}
      disabled={!username}
    >
      <User className="h-4 w-4" />
    </Button>
  );
};