import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Code, MessageSquare, Users, Star, Heart, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";

const portals = [
  {
    id: "social",
    title: "Social Feed",
    description: "Share photos, videos, and stories with your community. Like Instagram but better.",
    icon: Camera,
    color: "from-pink-500 to-purple-600",
    features: ["Photo & Video Sharing", "Stories", "Real-time Feed", "Follow System"],
    path: "/portals/social"
  },
  {
    id: "projects",
    title: "Project Hub",
    description: "Showcase your coding projects, get stars, and collaborate with others.",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    features: ["Project Showcase", "Technology Tags", "Star & Fork", "Collaboration"],
    path: "/portals/projects"
  },
  {
    id: "groups",
    title: "Group Chat",
    description: "Create and join groups for real-time messaging and community building.",
    icon: MessageSquare,
    color: "from-green-500 to-teal-500",
    features: ["Real-time Messaging", "Private/Public Groups", "Group Management", "Rich Media"],
    path: "/portals/groups"
  }
];

export const PortalNavigation = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-32 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6">
            Three Portals, <span className="gradient-text">One Experience</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your adventure or use them all. Each portal is designed to work seamlessly together.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {portals.map((portal, index) => (
            <Card key={portal.id} className="glass-card p-8 hover:scale-105 transition-all duration-500 group border-0" style={{ animationDelay: `${index * 200}ms` }}>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${portal.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <portal.icon className="w-full h-full text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 group-hover:gradient-text transition-all duration-300">
                {portal.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {portal.description}
              </p>
              
              <ul className="space-y-3 mb-8">
                {portal.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                variant="electric" 
                className="w-full group-hover:shadow-xl"
                onClick={() => navigate(portal.path)}
              >
                Explore {portal.title}
              </Button>
            </Card>
          ))}
        </div>
        
        {/* Stats Section */}
        <div className="mt-32 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="glass-card p-6 rounded-2xl">
              <div className="text-3xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="text-3xl font-bold gradient-electric-text mb-2">5K+</div>
              <div className="text-sm text-muted-foreground">Projects Shared</div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="text-3xl font-bold gradient-text mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Messages Sent</div>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <div className="text-3xl font-bold gradient-electric-text mb-2">99%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};