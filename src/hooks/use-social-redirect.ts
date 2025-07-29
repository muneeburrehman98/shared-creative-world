import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { socialService } from '@/lib/social';

export const useSocialRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSocialProfile = async () => {
      if (loading || !user) return;

      try {
        const profile = await socialService.getProfile();
        
        // If user doesn't have a complete social profile, redirect to setup
        if (!profile?.username || !profile?.display_name) {
          navigate('/portals/social/setup');
        }
      } catch (error) {
        console.error('Error checking social profile:', error);
        // If there's an error getting profile, assume they need to set it up
        navigate('/portals/social/setup');
      }
    };

    checkSocialProfile();
  }, [user, loading, navigate]);
};
