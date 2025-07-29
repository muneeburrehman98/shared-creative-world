import { useState } from 'react';
import { type Group } from '@/lib/group';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';

interface GroupListProps {
  groups: Group[];
  selectedGroup: Group | null;
  onSelectGroup: (group: Group) => void;
}

export const GroupList = ({ groups, selectedGroup, onSelectGroup }: GroupListProps) => {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-2 p-2">
        {groups.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            <p>No groups found</p>
          </div>
        ) : (
          groups.map((group) => (
            <Button
              key={group.id}
              variant={selectedGroup?.id === group.id ? "default" : "ghost"}
              className="w-full justify-start gap-2 h-auto py-2"
              onClick={() => onSelectGroup(group)}
            >
              <div className="flex items-center gap-2 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={group.name} />
                  <AvatarFallback>
                    <Users className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium truncate w-full">{group.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.member_count || 0} members
                  </span>
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </ScrollArea>
  );
};