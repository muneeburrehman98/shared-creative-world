import { supabase } from '@/integrations/supabase/client';

export interface Group {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  member_count: number;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const groupService = {
  // Groups CRUD
  async getGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as Group[]) || [];
  },

  async getPublicGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as Group[]) || [];
  },

  async getMyGroups(): Promise<Group[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data: memberData, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.data.user.id);

    if (error) throw error;
    
    if (!memberData || memberData.length === 0) return [];
    
    const groupIds = memberData.map(m => m.group_id);
    
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);
    
    if (groupsError) throw groupsError;
    return (groupsData as unknown as Group[]) || [];
  },

  async getGroupById(id: string): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Group;
  },

  async createGroup(group: {
    name: string;
    description: string;
    is_private: boolean;
  }): Promise<Group> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    // Create the group
    const { data, error } = await supabase
      .from('groups')
      .insert([{ ...group, created_by: user.data.user.id }])
      .select()
      .single();

    if (error) throw error;

    // Add the creator as an admin
    await supabase
      .from('group_members')
      .insert([{
        group_id: data.id,
        user_id: user.data.user.id,
        role: 'admin'
      }]);

    return data as Group;
  },

  async updateGroup(id: string, updates: {
    name?: string;
    description?: string;
    is_private?: boolean;
  }): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Group;
  },

  async deleteGroup(id: string) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Group Members
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, created_at')
      .eq('group_id', groupId);

    if (error) throw error;
    return (data as unknown as GroupMember[]) || [];
  },

  async joinGroup(groupId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    // Check if the group is private
    const { data: group } = await supabase
      .from('groups')
      .select('is_private')
      .eq('id', groupId)
      .single();

    if (group?.is_private) {
      throw new Error('This is a private group. You need an invitation to join.');
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.data.user.id)
      .single();

    if (existingMember) {
      throw new Error('You are already a member of this group.');
    }

    // Join the group
    const { error } = await supabase
      .from('group_members')
      .insert([{
        group_id: groupId,
        user_id: user.data.user.id,
        role: 'member'
      }]);

    if (error) throw error;
  },

  async leaveGroup(groupId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    // Check if the user is the last admin
    const { data: admins } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('role', 'admin');

    if (admins && admins.length === 1) {
      // Check if this user is the admin
      const { data: isAdmin } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.data.user.id)
        .eq('role', 'admin')
        .single();

      if (isAdmin) {
        throw new Error('You are the last admin. Please promote another member to admin before leaving.');
      }
    }

    // Leave the group
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.data.user.id);

    if (error) throw error;
  },

  async changeRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Messages
  async getMessages(groupId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as unknown as Message[]) || [];
  },

  async sendMessage(groupId: string, content: string): Promise<Message> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        group_id: groupId,
        user_id: user.data.user.id,
        content
      }])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Message;
  },

  // Real-time subscriptions
  subscribeToMessages(groupId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        // Fetch the complete message with profile info
        this.getMessageById(payload.new.id).then(message => {
          callback(message);
        });
      })
      .subscribe();
  },

  async getMessageById(id: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Message;
  }
};