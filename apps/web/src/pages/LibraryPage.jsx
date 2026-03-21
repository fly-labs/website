import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Bell, CheckCircle2 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';
import { books, topics, topicColors } from '@/lib/data/library.js';
import supabase from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { isValidEmail } from '@/lib/utils.js';
import { cn } from '@/lib/utils.js';
import { useTranslation } from 'react-i18next';

// Map topic names to translation keys
const topicKeyMap = {
  'All': 'all',
  'AI': 'ai',
  'Business': 'business',
  'Mindset': 'mindset',
  'Mindfulness': 'mindfulness',
  'Random': 'random',
};

const LibraryPage = () => {
  const { t } = useTranslation('library');
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
      const comingSoon = books.filter((b) => b.status === 'coming_soon');
      const results = await Promise.all(
        comingSoon.map((book) =>
          supabase.rpc('get_waitlist_count', { p_source: `library-${book.id}` })
        )
      );
      const counts = {};
      comingSoon.forEach((book, i) => {
        if (typeof results[i].data === 'number') counts[book.id] = results[i].data;
      });
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
      toast({ title: t('waitlist.invalidEmail'), description: t('waitlist.invalidEmailDesc'), variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: trimmed, source: `library-${book.id}` });

    if (error) {
      if (error.code === '23505') {
        toast({ title: t('waitlist.alreadyTitle'), description: t('waitlist.alreadyDesc') });
      } else {
        toast({ title: t('waitlist.failedTitle'), description: t('waitlist.failedDesc'), variant: 'destructive' });
        return;
      }
    } else {
      toast({ title: t('waitlist.joinedTitle'), description: t('waitlist.joinedDesc', { title: book.title }) });
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
        title: t('seo.title'),
        description: t('seo.description'),
        keywords: "free ebooks, AI ebook, business ebook, mindset, builder resources, Luiz Alves",
        url: "https://flylabs.fun/library",
        schema: [
          ...bookSchemas,
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://flylabs.fun/" },
              { "@type": "ListItem", "position": 2, "name": "Library" },
            ],
          },
        ],
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
              {t('hero.title')}
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
              {t('hero.subtitle')}
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
              const topicKey = topicKeyMap[topic];
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
                  {topicKey ? t(`topics.${topicKey}`) : topic}
                </button>
              );
            })}
          </motion.div>

          {/* Book grid */}
          {filtered.length === 0 ? (
            <motion.div {...fadeUp} className="text-center py-20">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">{t('empty.text')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((book, i) => {
                const colors = topicColors[book.topic] || topicColors.Random;
                const isAvailable = book.status === 'available';
                const isNotified = notifiedBooks.has(book.id);
                const waitCount = waitlistCounts[book.id];
                const topicKey = topicKeyMap[book.topic];

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
                          <p className="text-xs text-muted-foreground mt-2">{t('book.pages', { count: book.pageCount })}</p>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-grow p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full border", colors.text, colors.bg, colors.border)}>
                          {topicKey ? t(`topics.${topicKey}`) : book.topic}
                        </span>
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-0.5 rounded-full",
                          isAvailable
                            ? 'text-primary bg-primary/10 border border-primary/20'
                            : 'text-muted-foreground bg-muted border border-border'
                        )}>
                          {isAvailable ? t('book.free') : t('book.buildingNext')}
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
                          <Download className="w-4 h-4" /> {t('book.download')}
                        </button>
                      ) : isNotified ? (
                        <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4" /> {t('book.notified')}
                        </div>
                      ) : notifyingBook === book.id ? (
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('waitlist.emailPlaceholder')}
                            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onKeyDown={(e) => e.key === 'Enter' && handleNotify(book)}
                            autoFocus
                          />
                          <button
                            onClick={() => handleNotify(book)}
                            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                          >
                            {t('book.go')}
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
                            <Bell className="w-4 h-4" /> {t('book.notify')}
                          </button>
                          {waitCount > 0 && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              {t('waitlist.personWaiting', { count: waitCount })}
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
