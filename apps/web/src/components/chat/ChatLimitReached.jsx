import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { joinFlyBotWaitlist } from '@/lib/chatApi.js';
import { isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import supabase from '@/lib/supabaseClient.js';

export function ChatLimitReached({ messageCount, compact = false }) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState(currentUser?.email || '');
  const [status, setStatus] = useState('idle');
  const [waitlistCount, setWaitlistCount] = useState(null);

  useEffect(() => {
    supabase.rpc('get_waitlist_count', { p_source: 'flybot' })
      .then(({ data }) => { if (data) setWaitlistCount(data); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;

    setStatus('loading');
    try {
      await joinFlyBotWaitlist(email, currentUser?.id, messageCount);
      setStatus('done');
      trackEvent('flybot_waitlist_joined', { message_count: messageCount });
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex items-center justify-center p-6"
      >
        <div className="text-center max-w-xs">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Check className="w-5 h-5 text-primary" />
          </div>
          <h3 className={compact ? 'font-semibold mb-1 text-sm' : 'font-semibold mb-1.5'}>You're in. I'll ping you.</h3>
          <p className={compact ? 'text-xs text-muted-foreground/70 leading-relaxed' : 'text-sm text-muted-foreground/70 leading-relaxed'}>
            Thanks for chatting. Unlimited access is coming.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center p-6"
    >
      <div className={compact ? 'text-center max-w-xs' : 'text-center max-w-sm'}>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className={`inline-flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 ${compact ? 'w-10 h-10 mb-3' : 'w-12 h-12 mb-4'}`}
        >
          <Bot className={compact ? 'w-5 h-5 text-primary' : 'w-6 h-6 text-primary'} />
        </motion.div>
        <h3 className={compact ? 'font-semibold mb-1 text-sm' : 'font-semibold mb-1.5'}>
          That was fun. 10 messages flew by.
        </h3>
        <p className={compact ? 'text-xs text-muted-foreground/70 mb-4 leading-relaxed' : 'text-sm text-muted-foreground/70 mb-5 leading-relaxed'}>
          I'm still in beta, figuring things out (like you).
          Leave your email and you'll be first in line when I open up.
        </p>

        <form onSubmit={handleSubmit} className={compact ? 'flex gap-2 max-w-[260px] mx-auto' : 'flex gap-2 max-w-xs mx-auto'}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-[border-color,box-shadow]"
          />
          <button
            type="submit"
            disabled={!isValidEmail(email) || status === 'loading'}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Join the line'
            )}
          </button>
        </form>

        {status === 'error' && (
          <p className="text-xs text-red-500 mt-3">Something went wrong. Try again.</p>
        )}

        <p className="text-[10px] text-muted-foreground/40 mt-3">
          No spam. Just a heads up when unlimited access is ready.
          {waitlistCount > 0 && ` ${waitlistCount} ${waitlistCount === 1 ? 'person' : 'people'} already waiting.`}
        </p>
      </div>
    </motion.div>
  );
}
