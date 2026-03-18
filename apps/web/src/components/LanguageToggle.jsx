import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics.js';

export const LanguageToggle = () => {
  const { i18n, t } = useTranslation();
  const isPt = i18n.language === 'pt-BR';

  const toggle = () => {
    const next = isPt ? 'en' : 'pt-BR';
    i18n.changeLanguage(next);
    document.documentElement.lang = next === 'pt-BR' ? 'pt-BR' : 'en';
    trackEvent('language_changed', { language: next });
  };

  return (
    <motion.button
      onClick={toggle}
      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border-2 border-transparent hover:border-border focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 uppercase tracking-wide"
      aria-label={t('language.toggle')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isPt ? 'EN' : 'PT'}
    </motion.button>
  );
};
