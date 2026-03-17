import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { Loader2, Mail, Lock } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { GoogleIcon } from '@/components/GoogleIcon.jsx';
import supabase from '@/lib/supabaseClient.js';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/explore', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      navigate('/explore');
    } else {
      toast({
        title: "Login Failed",
        description: result.error || "Invalid email or password.",
        variant: "destructive"
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setIsGoogleLoading(false);
      toast({ title: "Google login failed", description: result.error, variant: "destructive" });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Enter your email first",
        description: "Type your email address above, then click forgot password.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    setIsResetting(false);

    if (error) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your inbox",
        description: "If an account exists for that email, we sent a reset link.",
      });
    }
  };

  return (
    <PageLayout
      seo={{
        title: "Log In | Fly Labs",
        description: "Log in to access your Fly Labs prompt library, Notion templates, and member-only tools. Email or Google sign-in supported.",
        keywords: "login, sign in, fly labs account, member access",
        url: "https://flylabs.fun/login",
        noindex: true,
      }}
      className="flex items-center justify-center pt-24 pb-12 px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground font-medium mt-2">Pick up where you left off.</p>
          </div>

          {/* Google OAuth first, lowest friction */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full h-12 flex items-center justify-center gap-3 border border-border rounded-xl hover:bg-muted transition-colors font-bold text-foreground mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-bold">Or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="Your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl transition-colors flex items-center justify-center mt-2"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Log In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors disabled:opacity-50"
            >
              {isResetting ? 'Sending...' : 'Forgot your password?'}
            </button>
            <p className="text-muted-foreground font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default LoginPage;
