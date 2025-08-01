import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { socialService, type Post, type Comment } from '@/lib/social';
import { useAuth } from '@/hooks/use-auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FollowButton } from '@/components/Social/FollowButton';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export const PostCard = ({ post, onDelete }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkLikeStatus();
  }, [post.id]);

  const checkLikeStatus = async () => {
    try {
      const liked = await socialService.checkLike(post.id);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    try {
      const newLikeStatus = await socialService.toggleLike(post.id);
      setIsLiked(newLikeStatus);
      setLikesCount(prev => newLikeStatus ? prev + 1 : prev - 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

  const loadComments = async () => {
    try {
      const fetchedComments = await socialService.getComments(post.id);
      setComments(fetchedComments);
      setShowComments(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await socialService.createComment(post.id, newComment);
      setNewComment('');
      await loadComments(); // Reload comments
      toast({
        title: "Success",
        description: "Comment added successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await socialService.deletePost(post.id);
      toast({
        title: "Success",
        description: "Post deleted successfully"
      });
      onDelete?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback>
              {post.profiles.display_name?.charAt(0) || post.profiles.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p 
              className="font-semibold text-sm cursor-pointer hover:underline"
              onClick={() => navigate(`/user/${post.profiles.username}`)}
            >
              {post.profiles.display_name || post.profiles.username}
            </p>
            <p className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
          </div>
          
          {user?.id !== post.user_id && (
            <FollowButton userId={post.user_id} size="sm" variant="outline" />
          )}
        </div>
        
        {user?.id === post.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {post.content && (
          <p className="text-sm">{post.content}</p>
        )}

        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post content" 
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {post.video_url && (
          <div className="rounded-lg overflow-hidden">
            <video 
              src={post.video_url} 
              controls 
              className="w-full h-auto max-h-96"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="flex items-center space-x-1"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm">{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadComments}
              className="flex items-center space-x-1"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{post.comments_count}</span>
            </Button>

            <Button variant="ghost" size="sm">
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.profiles.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles.display_name?.charAt(0) || comment.profiles.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs">
                      <span className="font-semibold">{comment.profiles.display_name || comment.profiles.username}</span>{' '}
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleComment} className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button type="submit" size="sm" disabled={loading || !newComment.trim()}>
                Post
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};