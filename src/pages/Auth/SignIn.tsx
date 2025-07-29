import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/Auth/AuthForm';
import { useAuth } from '@/hooks/use-auth';

const SignIn = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (email: string, password: string) => {
    return await signIn(email, password);
  };

  const handleModeChange = () => {
    navigate('/auth/signup');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthForm 
        mode="signin"
        onSubmit={handleSignIn}
        onModeChange={handleModeChange}
      />
    </div>
  );
};

export default SignIn;