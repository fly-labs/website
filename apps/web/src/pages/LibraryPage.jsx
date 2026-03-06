import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Bell, Loader2, CheckCircle2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';
import { books, topics, topicColors } from '@/lib/data/library.js';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { isValidEmail } from '@/lib/utils.js';
import { cn } from '@/lib/utils.js';

const LibraryPage = () => {
  const [activeTopic, setActiveTopic] = useState('All');
  const [waitlistCounts, setWaitlistCounts] = useState({});
  const [notifyingBook, setNotifyingBook] = useState(null);
  const [notifiedBooks, setNotifiedBooks] = useState(new Set());
  const [email, setEmail] = useState('');
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const filtered = activeTopic === 'All'
    ? books
    : books.filter((b) => b.topic === activeTopic);

  useEffect(() => {
    if (currentUser?.email) setEmail(currentUser.email);
  }, [currentUser]);

  useEffect(() => {
    const fetchCounts = async () => {
      const counts = {};
      for (const book of books.filter((b) => b.status === 'coming_soon')) {
        const { data } = await supabase.rpc('get_waitlist_count', { p_source: `library-${book.id}` });
        if (typeof data === 'number') counts[book.id] = data;
      }
      setWaitlistCounts(counts);
    };
    fetchCounts();
  }, [notifiedBooks]);

  const handleNotify = async (book) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setNotifyingBook(book.id);
      return;
    }
    if (!isValidEmail(trimmed)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: trimmed, source: `library-${book.id}` });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already on the list', description: "We'll notify you when it's ready." });
      } else {
        toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
        return;
      }
    } else {
      toast({ title: 'You\'re on the list!', description: `We'll notify you when "${book.title}" is ready.` });
      trackEvent('ebook_notify', { book_id: book.id, book_title: book.title, topic: book.topic });
    }

    setNotifiedBooks((prev) => new Set([...prev, book.id]));
    setNotifyingBook(null);
  };

  const handleDownload = (book) => {
    trackEvent('ebook_downloaded', { book_id: book.id, book_title: book.title, topic: book.topic });
    window.open(book.downloadUrl, '_blank');
  };

  const availableBooks = books.filter((b) => b.status === 'available');
  const bookSchemas = availableBooks.map((book) => ({
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "description": book.description,
    "author": { "@type": "Person", "name": "Luiz Alves" },
    "isAccessibleForFree": true,
    "url": `https://flylabs.fun/library`,
  }));

  return (
    <PageLayout
      seo={{
        title: "Free Ebooks for Builders",
        description: "Free ebooks from my study notes. AI, business, mindset, and everything in between. Written by Luiz Alves for people who build things.",
        keywords: "free ebooks, AI ebook, business ebook, mindset, builder resources, Luiz Alves",
        url: "https://flylabs.fun/library",
        ...(bookSchemas.length > 0 && { schema: bookSchemas }),
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-4">
              Library
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
              Free ebooks from my study notes. AI, business, mindset, and everything in between.
            </p>
          </motion.div>

          {/* Topic filter pills */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.3 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {topics.map((topic) => {
              const isActive = activeTopic === topic;
              const colors = topicColors[topic];
              return (
                <button
                  key={topic}
                  onClick={() => {
                    setActiveTopic(topic);
                    if (topic !== 'All') trackEvent('library_filter_change', { topic });
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-colors",
                    isActive
                      ? topic === 'All'
                        ? 'bg-foreground text-background'
                        : `${colors.bg} ${colors.text} border ${colors.border}`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {topic}
                </button>
              );
            })}
          </motion.div>

          {/* Book grid */}
          {filtered.length === 0 ? (
            <motion.div {...fadeUp} className="text-center py-20">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No books in this topic yet. More coming soon.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((book, i) => {
                const colors = topicColors[book.topic] || topicColors.Random;
                const isAvailable = book.status === 'available';
                const isNotified = notifiedBooks.has(book.id);
                const waitCount = waitlistCounts[book.id];

                return (
                  <motion.div
                    key={book.id}
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex flex-col rounded-xl border border-border/60 bg-card/50 overflow-hidden"
                  >
                    {/* Cover mockup */}
                    <div
                      className={cn(
                        "relative h-48 flex items-center justify-center p-6",
                        colors.bg
                      )}
                      onClick={() => trackEvent('ebook_clicked', { book_id: book.id, book_title: book.title, topic: book.topic, status: book.status })}
                    >
                      <div className="text-center">
                        <BookOpen className={cn("w-8 h-8 mx-auto mb-3 opacity-40", colors.text)} />
                        <h3 className="text-lg font-black text-foreground leading-tight px-2">
                          {book.title}
                        </h3>
                        {book.pageCount && (
                          <p className="text-xs text-muted-foreground mt-2">{book.pageCount} pages</p>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-grow p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", colors.text, colors.bg, colors.border)}>
                          {book.topic}
                        </span>
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-0.5 rounded-full",
                          isAvailable
                            ? 'text-primary bg-primary/10 border border-primary/20'
                            : 'text-muted-foreground bg-muted border border-border'
                        )}>
                          {isAvailable ? 'Free' : 'Coming soon'}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                        {book.description}
                      </p>

                      {isAvailable ? (
                        <button
                          onClick={() => handleDownload(book)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                        >
                          <Download className="w-4 h-4" /> Download Free
                        </button>
                      ) : isNotified ? (
                        <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4" /> You'll be notified
                        </div>
                      ) : notifyingBook === book.id ? (
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onKeyDown={(e) => e.key === 'Enter' && handleNotify(book)}
                            autoFocus
                          />
                          <button
                            onClick={() => handleNotify(book)}
                            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                          >
                            Go
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => {
                              if (email) {
                                handleNotify(book);
                              } else {
                                setNotifyingBook(book.id);
                              }
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Bell className="w-4 h-4" /> Notify me
                          </button>
                          {waitCount > 0 && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              {waitCount} {waitCount === 1 ? 'person' : 'people'} waiting
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  );
};

export default LibraryPage;
