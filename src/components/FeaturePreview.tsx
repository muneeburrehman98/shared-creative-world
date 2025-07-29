import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Star, GitFork, Users, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FeaturePreview = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-32 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6">
            See It In <span className="gradient-text">Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get a glimpse of what awaits you in each portal
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Social Feed Preview */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-8">Social Feed</h3>
            
            {/* Stories */}
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary p-1 mb-2">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={`https://images.unsplash.com/photo-148858071243${i}-e212871fec22?w=64&h=64&fit=crop&crop=face`} />
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs">User {i}</span>
                </div>
              ))}
            </div>
            
            {/* Post */}
            <Card className="glass-card border-0">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">jane_doe</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="mb-4 rounded-xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop" 
                    alt="Post" 
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto hover:bg-transparent"
                    onClick={() => navigate('/portals/social')}
                  >
                    <Heart className="h-6 w-6 text-red-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto hover:bg-transparent"
                    onClick={() => navigate('/portals/social')}
                  >
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto hover:bg-transparent"
                    onClick={() => navigate('/portals/social')}
                  >
                    <Share className="h-6 w-6" />
                  </Button>
                </div>
                
                <p className="text-sm mb-2"><span className="font-semibold">1,234 likes</span></p>
                <p className="text-sm">
                  <span className="font-semibold">jane_doe</span> Beautiful sunset at the mountains! 🌅 #nature #photography
                </p>
              </div>
            </Card>
          </div>
          
          {/* Project Hub Preview */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-8">Project Hub</h3>
            
            {[1, 2].map((i) => (
              <Card key={i} className="glass-card border-0">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://images.unsplash.com/photo-148858071243${i}-e212871fec22?w=40&h=40&fit=crop&crop=face`} />
                        <AvatarFallback>D{i}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">developer_{i}</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/portals/projects')}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <h4 className="text-lg font-bold mb-2">AI Chat Application</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    A modern chat app built with React and AI integration for smart responses.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">React</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Node.js</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">AI</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" /> 42
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" /> 12
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/portals/projects')}
                    >
                      View Project
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Group Chat Preview */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-8">Group Chat</h3>
            
            <Card className="glass-card border-0 h-96">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-electric flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Design Team</p>
                    <p className="text-xs text-muted-foreground">12 members online</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 flex-1 space-y-4 h-64 overflow-y-auto">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b95194b9?w=32&h=32&fit=crop&crop=face" />
                    <AvatarFallback>SA</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-secondary rounded-lg p-3">
                      <p className="text-sm">Hey team! Just finished the new mockups for the dashboard. Check them out! 🎨</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Sarah • 2 min ago</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" />
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-secondary rounded-lg p-3">
                      <p className="text-sm">Awesome work! The gradient effects look amazing ✨</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Mike • 1 min ago</p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-primary-foreground">Thanks! Ready for the presentation tomorrow 🚀</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input 
                    placeholder="Type a message..." 
                    className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button 
                    size="sm" 
                    variant="hero"
                    onClick={() => navigate('/portals/groups')}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};