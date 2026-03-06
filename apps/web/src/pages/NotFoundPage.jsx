import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout.jsx';
import { trackEvent } from '@/lib/analytics.js';

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => {
    trackEvent('page_not_found', {
      page_path: location.pathname,
      page_referrer: document.referrer,
    });
  }, [location.pathname]);

  return (
    <PageLayout
      seo={{
        title: "Page Not Found - 404",
        description: "The page you are looking for does not exist or may have been moved. Head back to Fly Labs to explore tools, templates, and AI prompts.",
        keywords: "404, page not found, fly labs",
        url: "https://flylabs.fun/404",
      }}
      className="flex items-center justify-center pt-24 pb-24 px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
          className="inline-flex p-5 rounded-2xl bg-muted/50 text-muted-foreground mb-8 border border-border"
        >
          <Ghost className="w-12 h-12" />
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4">404</h1>
        <p className="text-xl text-muted-foreground font-medium mb-8">
          This page doesn't exist. Maybe it was never built, or maybe it flew away.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
      </motion.div>
    </PageLayout>
  );
};

export default NotFoundPage;
