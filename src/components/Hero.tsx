import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Camera, Code, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-electric/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="gradient-text pulse-glow">Social</span>
            <span className="text-foreground">Hub</span>
          </h1>
          
          {/* Hero Subtitle */}
          <p className="text-2xl md:text-3xl mb-12 text-muted-foreground font-light">
            Where <span className="gradient-electric-text font-semibold">creativity meets collaboration</span>
          </p>
          
          {/* Hero Description */}
          <p className="text-lg md:text-xl mb-16 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The ultimate social platform combining Instagram-like sharing, GitHub-style project collaboration, 
            and Discord-inspired group messaging. All in one beautiful, seamless experience.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Button 
              variant="hero" 
              size="hero" 
              className="group"
              type="button"
              onClick={() => navigate('/auth/signup')}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="glass" 
              size="lg"
              type="button"
              onClick={() => navigate('/auth/signin')}
            >
              Sign In
            </Button>
          </div>
          
          {/* Feature Icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div 
              className="glass-card p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/portals/social')}
            >
              <Camera className="h-8 w-8 mx-auto mb-3 text-primary" />
              <p className="text-sm font-medium">Share Moments</p>
            </div>
            <div 
              className="glass-card p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/portals/projects')}
            >
              <Code className="h-8 w-8 mx-auto mb-3 text-accent-electric" />
              <p className="text-sm font-medium">Showcase Projects</p>
            </div>
            <div 
              className="glass-card p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/portals/groups')}
            >
              <MessageSquare className="h-8 w-8 mx-auto mb-3 text-primary-glow" />
              <p className="text-sm font-medium">Group Chat</p>
            </div>
            <div 
              className="glass-card p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => navigate('/portals/social')}
            >
              <Users className="h-8 w-8 mx-auto mb-3 text-success" />
              <p className="text-sm font-medium">Connect</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </div>
  );
};