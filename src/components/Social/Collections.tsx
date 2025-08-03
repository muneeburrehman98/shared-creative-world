import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Collection, CollectionItem, Post } from '@/lib/social/types';
import { socialService } from '@/lib/social';
import { Plus, FolderPlus, Lock, Globe, X } from 'lucide-react';

interface CollectionsProps {
  post?: Post; // Optional post to save to a collection
  onClose?: () => void;
}

export const Collections = ({ post, onClose }: CollectionsProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await socialService.getCollections();
      setCollections(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const collection = await socialService.createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
        is_private: isPrivate
      });

      setCollections(prev => [...prev, collection]);
      setCreateDialogOpen(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPrivate(true);

      toast({
        title: "Success",
        description: "Collection created successfully"
      });

      // If a post was provided, save it to the new collection
      if (post) {
        await socialService.addToCollection(collection.id, post.id);
        toast({
          title: "Success",
          description: `Post saved to "${collection.name}"`
        });
        if (onClose) onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveToCollection = async (collectionId: string) => {
    if (!post) return;

    setLoading(true);
    try {
      await socialService.addToCollection(collectionId, post.id);
      
      const collectionName = collections.find(c => c.id === collectionId)?.name;
      toast({
        title: "Success",
        description: `Post saved to "${collectionName}"`
      });
      
      if (onClose) onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save post to collection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {post ? (
        <h3 className="text-lg font-medium">Save to Collection</h3>
      ) : (
        <h3 className="text-lg font-medium">Your Collections</h3>
      )}

      <div className="grid grid-cols-1 gap-3">
        <Button 
          variant="outline" 
          className="flex items-center justify-center p-6 border-dashed"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Collection
        </Button>

        {collections.map((collection) => (
          <div 
            key={collection.id} 
            className="border rounded-lg p-4 flex justify-between items-center"
            onClick={post ? () => saveToCollection(collection.id) : undefined}
            style={{ cursor: post ? 'pointer' : 'default' }}
          >
            <div>
              <div className="flex items-center">
                <h4 className="font-medium">{collection.name}</h4>
                {collection.is_private && (
                  <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                )}
              </div>
              {collection.description && (
                <p className="text-sm text-muted-foreground">{collection.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {collection.item_count || 0} {collection.item_count === 1 ? 'post' : 'posts'}
              </p>
            </div>
            {!post && (
              <Button variant="ghost" size="sm">
                View
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Create Collection Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Favorites, Inspiration, Travel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="What's this collection about?"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private">
                Private Collection
                <p className="text-xs text-muted-foreground">
                  {isPrivate ? 'Only you can see this collection' : 'Anyone can see this collection'}
                </p>
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={createCollection}
                disabled={loading || !newCollectionName.trim()}
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};