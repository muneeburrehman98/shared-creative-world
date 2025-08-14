import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Users, Hash, MapPin } from 'lucide-react';
import { PostCard } from './PostCard';
import { FollowButton } from './FollowButton';
import { socialService } from '@/lib/social';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Post } from '@/lib/social/types';

interface TrendingHashtag {
  hashtag: string;
  count: number;
}

interface SuggestedUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  followers_count: number;
  bio?: string;
}

export const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    posts: Post[];
    users: SuggestedUser[];
    hashtags: TrendingHashtag[];
  }>({ posts: [], users: [], hashtags: [] });
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadExploreData();
    }
  }, [user]);

  const loadExploreData = async () => {
    setLoading(true);
    try {
      // Load trending posts (posts with most likes/comments in last 24h)
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('is_private', false)
        .order('likes_count', { ascending: false })
        .limit(20);

      if (posts) {
        // Fetch profiles for posts
        const postsWithProfiles = await Promise.all(
          posts.map(async (post) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('user_id', post.user_id)
              .single();

            return {
              ...post,
              profiles: profile || { username: '', display_name: '', avatar_url: null }
            };
          })
        );
        setTrendingPosts(postsWithProfiles as Post[]);
      }

      // Load suggested users (users with most followers that current user doesn't follow)
      if (user) {
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = following?.map(f => f.following_id) || [];

        const { data: users } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, followers_count, bio')
          .not('user_id', 'in', `(${[user.id, ...followingIds].join(',')})`)
          .order('followers_count', { ascending: false })
          .limit(10);

        setSuggestedUsers(users as SuggestedUser[] || []);
      }

      // Mock trending hashtags (would need hashtag tracking)
      setTrendingHashtags([
        { hashtag: 'technology', count: 1234 },
        { hashtag: 'photography', count: 890 },
        { hashtag: 'travel', count: 567 },
        { hashtag: 'food', count: 432 },
        { hashtag: 'fitness', count: 321 }
      ]);
    } catch (error) {
      console.error('Error loading explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ posts: [], users: [], hashtags: [] });
      return;
    }

    setLoading(true);
    try {
      // Search posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .textSearch('content', query)
        .eq('is_private', false)
        .limit(10);

      // Search users
      const { data: users } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, followers_count, bio')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(10);

      // Search hashtags (mock for now)
      const hashtagResults = trendingHashtags.filter(tag => 
        tag.hashtag.toLowerCase().includes(query.toLowerCase())
      );

      // Fetch profiles for posts
      const postsWithProfiles = posts ? await Promise.all(
        posts.map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', post.user_id)
            .single();

          return {
            ...post,
            profiles: profile || { username: '', display_name: '', avatar_url: null }
          };
        })
      ) : [];

      setSearchResults({
        posts: postsWithProfiles as Post[],
        users: users as SuggestedUser[] || [],
        hashtags: hashtagResults
      });
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to hashtag page or load posts with hashtag
    setSearchQuery(`#${hashtag}`);
    handleSearch(`#${hashtag}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, users, hashtags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Results or Explore Content */}
      {searchQuery.trim() ? (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Posts ({searchResults.posts.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People ({searchResults.users.length})
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tags ({searchResults.hashtags.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-6">
            {searchResults.posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No posts found</p>
              </div>
            ) : (
              searchResults.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-6">
            {searchResults.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.users.map((suggestedUser) => (
                  <Card key={suggestedUser.user_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            className="h-12 w-12 cursor-pointer"
                            onClick={() => navigate(`/user/${suggestedUser.username}`)}
                          >
                            <AvatarImage src={suggestedUser.avatar_url} />
                            <AvatarFallback>
                              {suggestedUser.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p 
                              className="font-semibold cursor-pointer hover:underline"
                              onClick={() => navigate(`/user/${suggestedUser.username}`)}
                            >
                              {suggestedUser.display_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{suggestedUser.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {suggestedUser.followers_count} followers
                            </p>
                            {suggestedUser.bio && (
                              <p className="text-sm mt-1">{suggestedUser.bio}</p>
                            )}
                          </div>
                        </div>
                        {user?.id !== suggestedUser.user_id && (
                          <FollowButton userId={suggestedUser.user_id} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-4 mt-6">
            {searchResults.hashtags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hashtags found</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {searchResults.hashtags.map((hashtag) => (
                  <Card 
                    key={hashtag.hashtag}
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleHashtagClick(hashtag.hashtag)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">#{hashtag.hashtag}</p>
                          <p className="text-sm text-muted-foreground">
                            {hashtag.count} posts
                          </p>
                        </div>
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Explore Content */
        <div className="space-y-6">
          {/* Trending Hashtags */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5" />
                <h3 className="font-semibold">Trending Hashtags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map((hashtag) => (
                  <Badge
                    key={hashtag.hashtag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleHashtagClick(hashtag.hashtag)}
                  >
                    #{hashtag.hashtag} ({hashtag.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Users */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5" />
                <h3 className="font-semibold">Suggested for you</h3>
              </div>
              <div className="space-y-3">
                {suggestedUsers.slice(0, 3).map((suggestedUser) => (
                  <div key={suggestedUser.user_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        className="h-10 w-10 cursor-pointer"
                        onClick={() => navigate(`/user/${suggestedUser.username}`)}
                      >
                        <AvatarImage src={suggestedUser.avatar_url} />
                        <AvatarFallback>
                          {suggestedUser.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p 
                          className="font-medium text-sm cursor-pointer hover:underline"
                          onClick={() => navigate(`/user/${suggestedUser.username}`)}
                        >
                          {suggestedUser.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{suggestedUser.username} • {suggestedUser.followers_count} followers
                        </p>
                      </div>
                    </div>
                    <FollowButton userId={suggestedUser.user_id} size="sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Posts */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Trending Posts</span>
            </h3>
            <div className="space-y-4">
              {trendingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};