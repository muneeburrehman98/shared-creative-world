import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/Auth/AuthForm';
import { useAuth } from '@/hooks/use-auth';

const SignUp = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignUp = async (email: string, password: string) => {
    return await signUp(email, password);
  };

  const handleModeChange = () => {
    navigate('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthForm 
        mode="signup"
        onSubmit={handleSignUp}
        onModeChange={handleModeChange}
      />
    </div>
  );
};

export default SignUp;