import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Bookmark } from 'lucide-react';
import { Post } from '@/lib/social/types';
import { Collections } from './Collections';

interface SaveToCollectionButtonProps {
  post: Post;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const SaveToCollectionButton = ({ 
  post, 
  variant = 'ghost',
  size = 'sm'
}: SaveToCollectionButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className="flex items-center space-x-1"
      >
        <Bookmark className="h-5 w-5" />
        {size !== 'icon' && <span className="text-sm">Save</span>}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <Collections post={post} onClose={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};