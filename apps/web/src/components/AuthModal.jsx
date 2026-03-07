
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { Loader2, ArrowLeft, Mail, Lock, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/GoogleIcon.jsx';
import { motion } from 'framer-motion';

export const AuthModal = () => {
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({ title: "Welcome back!", description: "Loading your tools..." });
    } else {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const result = await signup(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({ title: "Account created!", description: "Loading your tools..." });
    } else {
      toast({ title: "Signup Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleGoogleAuth = () => {
    setIsGoogleLoading(true);
    loginWithGoogle().then((result) => {
      if (result.success) {
        toast({ title: "Success!", description: "Authenticated with Google." });
      } else {
        setIsGoogleLoading(false);
        toast({ title: "Auth Failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const getPasswordStrength = (pass) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 25;
    if (pass.length < 8) return 50;
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/)) return 100;
    return 75;
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 rounded-full hover:bg-muted"
          onClick={() => navigate('/')}
          title="Go Back"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center mt-6 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Unlock this tool</h2>
          <p className="text-muted-foreground text-sm mt-1">Create a free account to access prompts, templates, and tools.</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Log In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Create password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {password && (
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-[width,background-color] ${getPasswordStrength(password) > 50 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${getPasswordStrength(password)}%` }}
                    />
                  </div>
                )}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-bold">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          className="w-full font-bold"
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <GoogleIcon className="w-4 h-4 mr-2" />
          )}
          Google
        </Button>
      </motion.div>
    </div>
  );
};
