import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from '@/components/Social/ActivityFeed';
import { useNavigate } from 'react-router-dom';

export const SocialActivity = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/portals/social')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-semibold text-xl">Activity</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <ActivityFeed />
      </div>
    </div>
  );
};