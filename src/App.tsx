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
          <Route path="/social" element={<SocialFeed />} />
          <Route path="/portals/social" element={<SocialFeed />} />
          <Route path="/portals/social/setup" element={<CreateSocialAccount />} />
          <Route path="/portals/following" element={<FollowingFeed />} />
          <Route path="/user/:username" element={<PublicProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
