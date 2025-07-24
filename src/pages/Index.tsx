import { Hero } from "@/components/Hero";
import { PortalNavigation } from "@/components/PortalNavigation";
import { FeaturePreview } from "@/components/FeaturePreview";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, signOut, loading } = useAuth();

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
            <h1 className="text-3xl font-bold gradient-text">Welcome to SocialHub!</h1>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-8">
              Hello {user.email}! You're successfully signed in.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/social'}
              >
                Go to Social Feed
              </Button>
              <p className="text-muted-foreground">
                This is where your authenticated app content will go.
              </p>
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
