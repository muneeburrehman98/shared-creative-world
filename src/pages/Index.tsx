import { Hero } from "@/components/Hero";
import { PortalNavigation } from "@/components/PortalNavigation";
import { FeaturePreview } from "@/components/FeaturePreview";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold gradient-text">Welcome to Creative World!</h1>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Social Feed</h2>
              <p className="text-muted-foreground mb-4">Connect with other creators and share your work</p>
              <Button 
                className="w-full"
                onClick={() => navigate('/portals/social')}
              >
                Go to Social Feed
              </Button>
            </div>
            
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Project Hub</h2>
              <p className="text-muted-foreground mb-4">Showcase your projects and discover others' work</p>
              <Button 
                className="w-full"
                onClick={() => navigate('/portals/projects')}
              >
                Explore Projects
              </Button>
            </div>
            
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Group Chat</h2>
              <p className="text-muted-foreground mb-4">Join discussions and collaborate with others</p>
              <Button 
                className="w-full"
                onClick={() => navigate('/portals/groups')}
              >
                Join Discussions
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <PortalNavigation />
      <FeaturePreview />
    </div>
  );
};

export default Index;
