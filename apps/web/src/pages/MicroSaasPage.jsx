import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, ArrowLeft, ArrowRight, CheckCircle2, Mail, Loader2, Zap, Wrench, Layers,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';
import supabase from '@/lib/supabaseClient.js';
import { isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';

const MicroSaasPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await supabase.rpc('get_waitlist_count', { p_source: 'micro-tools' });
      if (!error && typeof data === 'number') {
        setWaitlistCount(data);
      }
    };
    fetchCount();
  }, [isSubmitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: trimmed, source: 'micro-tools' });

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast({ title: "You're already on the list.", description: "We'll ping you when the first tools ship." });
        setIsSubmitted(true);
      } else {
        toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      }
    } else {
      setIsSubmitted(true);
      trackEvent('waitlist_joined', { source: 'micro-tools' });
      toast({ title: "You're in!", description: "We'll ping you when the first tools ship." });
    }
  };

  return (
    <PageLayout
      seo={{
        title: "Micro Tools - Small Apps That Solve One Problem",
        description: "Small, focused tools that solve one problem really well. Open them, use them, done. Join the waitlist for upcoming micro tools from Fly Labs.",
        keywords: "micro tools, small apps, AI tools, automation, no-code tools, indie maker, waitlist",
        url: "https://flylabs.fun/microsaas",
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Micro Tools",
          "description": "Small, focused tools that solve one problem really well. Built by Fly Labs.",
          "url": "https://flylabs.fun/microsaas",
          "author": { "@type": "Person", "name": "Luiz Alves" }
        },
      }}
      wrapperClassName="overflow-hidden"
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">

          <div className="mb-12">
            <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explore
            </Link>
          </div>

          {/* Hero */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6 border border-primary/20 shadow-inner"
            >
              <Rocket className="h-8 w-8" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-black tracking-tight mb-6"
            >
              Micro Tools
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed"
            >
              Small, focused tools that solve one problem really well. Open them, use them, done.
            </motion.p>
          </div>

          {/* Value props */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16"
          >
            {[
              { icon: Zap, label: 'Does one thing well', sublabel: 'Open it, use it, move on' },
              { icon: Wrench, label: 'Scratched my own itch', sublabel: 'Each one started as something I needed' },
              { icon: Layers, label: 'Free and open source', sublabel: 'Use it, fork it, whatever you want' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="text-center p-6 rounded-2xl border border-border/60 bg-card/50"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5" />
                </div>
                <p className="font-bold text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.sublabel}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Waitlist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
              <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                Get early access
              </h2>
              <p className="text-muted-foreground font-medium mb-6">
                The first batch is almost ready. Drop your email and be the first to know.
              </p>

              {isSubmitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 text-base font-medium text-primary bg-primary/10 border border-primary/20 px-5 py-3 rounded-xl"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  You are in.
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      aria-label="Email address"
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="shrink-0 h-12 px-5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Join <span className="hidden sm:inline">the Waitlist</span> <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}

              {waitlistCount > 10 && (
                <p className="text-xs text-muted-foreground/60 font-medium mt-4">
                  Join {waitlistCount} others on the waitlist
                </p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </PageLayout>
  );
};

export default MicroSaasPage;
