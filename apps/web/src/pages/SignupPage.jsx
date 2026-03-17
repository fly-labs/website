import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { Loader2, Mail, Lock, ShieldCheck, Sparkles, Code, LayoutTemplate } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { GoogleIcon } from '@/components/GoogleIcon.jsx';
import { PROMPT_COUNT } from '@/lib/data/siteStats.js';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signup, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast({ title: "Passwords don't match", description: "Please ensure both passwords are the same.", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters long.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const result = await signup(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Welcome to Fly Labs!", description: "Your account has been created. Tell us a bit about yourself!" });
      navigate('/profile');
    } else {
      toast({ title: "Signup Failed", description: result.error || "Could not create account. Email might be in use.", variant: "destructive" });
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setIsGoogleLoading(false);
      toast({ title: "Google signup failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <PageLayout
      seo={{
        title: "Sign Up | Fly Labs",
        description: "Create a free Fly Labs account to unlock the full AI prompt library, Notion templates, and micro tools. Sign up with email or Google in seconds.",
        keywords: "sign up, create account, free account, fly labs, join community",
        url: "https://flylabs.fun/signup",
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
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black tracking-tight">Join the Lab</h1>
            <p className="text-muted-foreground font-medium mt-2">Create a free account. Unlock everything:</p>
          </div>

          {/* Value proposition */}
          <div className="flex flex-col gap-2 mb-6 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-3 text-sm">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">{PROMPT_COUNT} AI prompts, copy-paste ready</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <LayoutTemplate className="w-4 h-4 text-secondary shrink-0" />
              <span className="font-medium">Notion templates that actually save time</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Code className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-medium">Early access to everything we ship</span>
            </div>
          </div>

          {/* Google OAuth first */}
          <button
            onClick={handleGoogleSignup}
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
              <label htmlFor="signup-email" className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input id="signup-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="text-sm font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input id="signup-password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="Min. 8 characters" />
              </div>
              <p className="text-xs text-muted-foreground/70 pl-1">Must be at least 8 characters</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-confirm" className="text-sm font-medium text-muted-foreground">Confirm password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input id="signup-confirm" type="password" required autoComplete="new-password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="Repeat password" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl transition-colors flex items-center justify-center mt-2">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Free Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default SignupPage;
