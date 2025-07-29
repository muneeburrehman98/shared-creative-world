import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import SocialFeed from "./pages/Portals/SocialFeed";
import { PublicProfile } from "./pages/Portals/PublicProfile";
import { CreateSocialAccount } from "./pages/Portals/CreateSocialAccount";
import { FollowingFeed } from "./pages/Portals/FollowingFeed";
import ProjectHub from "./pages/Portals/ProjectHub";
import ProjectDetail from "./pages/Portals/ProjectDetail";
import { GroupChat } from "./pages/Portals/GroupChat";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import Nuets from "./pages/Portals/social/Nuets";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          
          {/* Protected Routes */}
          <Route path="/social" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
          <Route path="/portals/social" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
          <Route path="/portals/social/setup" element={<ProtectedRoute><CreateSocialAccount /></ProtectedRoute>} />
          <Route path="/portals/following" element={<ProtectedRoute><FollowingFeed /></ProtectedRoute>} />
          <Route path="/user/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
          
          {/* Project Routes */}
          <Route path="/portals/projects" element={<ProtectedRoute><ProjectHub /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          
          {/* Group Routes */}
          <Route path="/portals/groups" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
          
          <Route path="/portals/social/nuets" element={<ProtectedRoute><Nuets /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
