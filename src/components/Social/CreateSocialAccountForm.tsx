import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';
import { socialService } from '@/lib/social';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const socialAccountSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  dob: z.string().optional(),
  nutech_id: z.string()
    .regex(/^NUTECH\d{3}$/, 'NUTECH ID must be in format NUTECH followed by 3 digits')
    .optional(),
  department: z.string()
    .min(2, 'Department must be at least 2 characters')
    .optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone_number: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional(),
  is_private: z.boolean().default(false),
});

type SocialAccountFormData = z.infer<typeof socialAccountSchema>;

interface CreateSocialAccountFormProps {
  onComplete: () => void;
}

export const CreateSocialAccountForm = ({ onComplete }: CreateSocialAccountFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<SocialAccountFormData>({
    resolver: zodResolver(socialAccountSchema),
    defaultValues: {
      username: '',
      full_name: '',
      display_name: '',
      dob: '',
      nutech_id: '',
      department: '',
      bio: '',
      phone_number: '',
      is_private: false,
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SocialAccountFormData) => {
    setIsLoading(true);
    try {
      let avatar_url = '';
      
      // Upload avatar if provided
      if (avatarFile) {
        avatar_url = await socialService.uploadFile(avatarFile, 'social-images');
      }

      // Update profile with social account data
      await socialService.updateProfile({
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        is_private: data.is_private,
        avatar_url: avatar_url || undefined,
      });

      // Update extended profile fields (we'll need to update social service)
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          dob: data.dob || null,
          nutech_id: data.nutech_id || null,
          department: data.department || null,
          phone_number: data.phone_number || null,
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: 'Account created!',
        description: 'Your social account has been set up successfully.',
      });

      onComplete();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to create social account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Complete Your Social Profile</CardTitle>
        <CardDescription>
          Set up your social account to start connecting with others
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label htmlFor="avatar">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Avatar
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Michael Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nutech_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NUTECH ID</FormLabel>
                    <FormControl>
                      <Input placeholder="NUTECH001" {...field} />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      Format: NUTECH followed by 3 digits (e.g., NUTECH001)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      Include country code (e.g., +1 for US)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us a bit about yourself..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-6">
                  <h3 className="font-medium mb-2">Privacy Notice</h3>
                  <p className="text-sm text-muted-foreground">
                    Your profile information helps others find and connect with you. Private accounts require your approval for new followers, and your posts will only be visible to approved followers.
                  </p>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? 'Creating Account...' : 'Complete Setup'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};