import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { groupService, type Group, type Message } from '@/lib/group';
import { Home, MessageSquare, Users, Plus, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateGroupModal } from '@/components/Groups/CreateGroupModal';
import { GroupList } from '@/components/Groups/GroupList';
import { formatDistanceToNow } from 'date-fns';

export const GroupChat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/signin');
      return;
    }

    if (user) {
      loadGroups();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (selectedGroup) {
      loadMessages();
      
      // Subscribe to new messages
      const subscription = groupService.subscribeToMessages(
        selectedGroup.id,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroups = async () => {
    try {
      const myGroups = await groupService.getMyGroups();
      setGroups(myGroups);
      
      if (myGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(myGroups[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedGroup) return;
    
    try {
      const groupMessages = await groupService.getMessages(selectedGroup.id);
      setMessages(groupMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroup || !user) return;
    
    try {
      await groupService.sendMessage(selectedGroup.id, messageInput);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Group Chat</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" /> Home
          </Button>
          <CreateGroupModal onGroupCreated={loadGroups} />
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Group List */}
        <Card className="col-span-12 md:col-span-3 overflow-hidden">
          <CardHeader className="p-4">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2" /> Groups
            </CardTitle>
          </CardHeader>
          <GroupList 
            groups={groups} 
            selectedGroup={selectedGroup} 
            onSelectGroup={setSelectedGroup} 
          />
        </Card>
        
        {/* Chat Area */}
        <Card className="col-span-12 md:col-span-9 flex flex-col overflow-hidden">
          {selectedGroup ? (
            <>
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg">{selectedGroup.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex ${message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[80%]`}>
                            {message.user_id !== user?.id && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.profiles?.avatar_url || ''} />
                                <AvatarFallback>{message.profiles?.display_name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              {message.user_id !== user?.id && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {message.profiles?.display_name || 'Unknown'}
                                </p>
                              )}
                              <div className={`p-3 rounded-lg ${message.user_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p>{message.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Group Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a group from the list or create a new one to start chatting
                </p>
                <CreateGroupModal onGroupCreated={loadGroups} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
