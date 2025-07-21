import { Hero } from "@/components/Hero";
import { PortalNavigation } from "@/components/PortalNavigation";
import { FeaturePreview } from "@/components/FeaturePreview";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <PortalNavigation />
      <FeaturePreview />
    </div>
  );
};

export default Index;
