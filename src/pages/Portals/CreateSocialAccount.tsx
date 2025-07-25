import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateSocialAccountForm } from '@/components/Social/CreateSocialAccountForm';
import { supabase } from '@/integrations/supabase/client';
import { socialService } from '@/lib/social';

export const CreateSocialAccount = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSocialAccountStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth/signin');
          return;
        }

        // Check if user already has a complete social profile
        const profile = await socialService.getProfile();
        
        if (profile?.username && profile?.display_name) {
          // User already has a social account, redirect to feed
          navigate('/portals/social');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking social account status:', error);
        setIsLoading(false);
      }
    };

    checkSocialAccountStatus();
  }, [navigate]);

  const handleComplete = () => {
    navigate('/portals/social');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <CreateSocialAccountForm onComplete={handleComplete} />
      </div>
    </div>
  );
};