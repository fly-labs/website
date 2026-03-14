import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { joinFlyBotWaitlist } from '@/lib/chatApi.js';
import { isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';

export function ChatLimitReached({ messageCount }) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState(currentUser?.email || '');
  const [status, setStatus] = useState('idle'); // idle, loading, done, error

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
        className="flex-1 flex items-center justify-center p-4"
      >
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">You're on the list</h3>
          <p className="text-sm text-muted-foreground">
            I'll let you know when unlimited access opens up. Thanks for chatting.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex items-center justify-center p-4"
    >
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-3">
          <Mail className="w-6 h-6 text-amber-500" />
        </div>
        <h3 className="font-semibold mb-1">That's your 5 free messages</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          I enjoyed this. Want to keep going? Leave your email and I'll let you know when unlimited access opens up.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={!isValidEmail(email) || status === 'loading'}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Notify me'
            )}
          </button>
        </form>

        {status === 'error' && (
          <p className="text-xs text-red-500 mt-2">Something went wrong. Try again.</p>
        )}
      </div>
    </motion.div>
  );
}
