-- Create triggers for the existing database functions
-- These triggers are needed to make the functions actually work

-- Trigger for handling new users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating updated_at timestamps on profiles
CREATE OR REPLACE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at timestamps on posts
CREATE OR REPLACE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at timestamps on comments
CREATE OR REPLACE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at timestamps on follows
CREATE OR REPLACE TRIGGER update_follows_updated_at
    BEFORE UPDATE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating post likes count
CREATE OR REPLACE TRIGGER post_likes_count_trigger
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger for updating post comments count
CREATE OR REPLACE TRIGGER post_comments_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger for updating follow counts
CREATE OR REPLACE TRIGGER follow_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_follow_counts();