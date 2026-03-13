
import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';

const NewsletterPage = () => {
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://falacomigo.substack.com/feed', { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        if (data.status === 'ok') {
          setArticles(data.items);
        } else {
          setError(true);
        }
      } catch (err) {
        // silently fail
        setError(true);
      } finally {
        setLoadingArticles(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <PageLayout
      seo={{
        title: "Fala Comigo! | Vibe Building in Public",
        description: "Vibe building in public. Follow along as I build projects in my spare time using AI and share everything: micro tools, prompts, templates, and whatever I figure out along the way.",
        keywords: "newsletter, vibe building, building in public, AI, digital assets, Luiz Alves, CFA, falacomigo, Substack",
        url: "https://flylabs.fun/newsletter",
        schema: {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Fala Comigo!",
          "description": "Vibe building in public. Micro tools, prompts, templates, and whatever I figure out building projects with AI.",
          "url": "https://falacomigo.substack.com",
          "author": { "@type": "Person", "name": "Luiz Alves" },
        },
      }}
      className="pt-32 pb-24 flex flex-col items-center"
    >
      <div className="container mx-auto px-6 w-full max-w-5xl">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">
            Free on Substack
          </p>
          <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight">
            Fala <span className="text-primary">Comigo!</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed mb-8">
            Vibe building in public. Follow along as I build projects in my spare time using AI and share everything: micro tools, prompts, templates, and whatever I figure out along the way. In English and Portuguese. Always free.
          </p>
          <a
            href="https://falacomigo.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Subscribe on Substack (opens in new tab)"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:bg-primary/90 transition-colors"
            onClick={() => trackEvent('newsletter_click', { location: 'newsletter_hero' })}
          >
            Subscribe on Substack <ExternalLink className="w-5 h-5 ml-2" />
          </a>
        </motion.div>

        {/* Articles List */}
        <div className="w-full">
          <motion.h2
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-widest text-primary mb-8"
          >
            Recent editions
          </motion.h2>

          {loadingArticles ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-20 text-muted-foreground">
              <AlertCircle className="w-10 h-10 mb-4 text-muted-foreground/50" />
              <p className="font-medium mb-2">Could not load articles right now.</p>
              <a
                href="https://falacomigo.substack.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Read directly on Substack (opens in new tab)"
                className="text-primary font-semibold hover:underline inline-flex items-center"
                onClick={() => trackEvent('newsletter_click', { location: 'newsletter_error_fallback' })}
              >
                Read directly on Substack <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          ) : (
            <div className="divide-y divide-border mb-16">
              {articles.map((article) => (
                <motion.a
                  key={article.link || article.guid}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read "${article.title}" on Substack (opens in new tab)`}
                  onClick={() => trackEvent('article_click', { article_title: article.title, location: 'newsletter_feed' })}
                  {...fadeUp}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col md:flex-row gap-6 py-8 group"
                >
                  {article.thumbnail && (
                    <div className="w-full md:w-56 lg:w-64 shrink-0 h-32 md:h-auto rounded-lg overflow-hidden bg-muted">
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center min-w-0 flex-grow">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.pubDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {article.description.replace(/<[^>]*>?/gm, '')}
                    </p>
                    <span className="inline-flex items-center text-sm font-medium text-primary transition-colors">
                      Read on Substack
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="bg-primary/10 border border-primary/20 rounded-3xl p-6 md:p-10 lg:p-16 text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-4">Never miss an edition</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            I build digital stuff for fun using AI and document the process. Subscribe on Substack and it lands in your inbox, always free.
          </p>
          <a
            href="https://falacomigo.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Subscribe on Substack (opens in new tab)"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:bg-primary/90 transition-colors"
            onClick={() => trackEvent('newsletter_click', { location: 'newsletter_bottom_cta' })}
          >
            Subscribe on Substack <ExternalLink className="w-5 h-5 ml-2" />
          </a>
        </motion.div>

      </div>
    </PageLayout>
  );
};

export default NewsletterPage;
