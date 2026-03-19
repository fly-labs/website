import React from 'react';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@/lib/analytics.js';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language === 'pt-BR';

  const switchTo = (lang) => {
    if ((lang === 'pt-BR') === isPt) return;
    i18n.changeLanguage(lang);
    trackEvent('language_changed', { language: lang });
  };

  return (
    <div
      className="relative flex items-center bg-muted/50 rounded-lg border border-border p-0.5 gap-0"
      role="radiogroup"
      aria-label="Language"
    >
      <button
        onClick={() => switchTo('en')}
        className={`relative z-10 px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-colors duration-200 ${
          !isPt
            ? 'text-foreground'
            : 'text-muted-foreground/60 hover:text-muted-foreground'
        }`}
        role="radio"
        aria-checked={!isPt}
        aria-label="English"
      >
        EN
      </button>
      <button
        onClick={() => switchTo('pt-BR')}
        className={`relative z-10 px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-colors duration-200 ${
          isPt
            ? 'text-foreground'
            : 'text-muted-foreground/60 hover:text-muted-foreground'
        }`}
        role="radio"
        aria-checked={isPt}
        aria-label="Português"
      >
        PT
      </button>
      {/* Sliding highlight */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md bg-background shadow-sm border border-border/50 transition-all duration-200 ease-out"
        style={{
          width: 'calc(50% - 2px)',
          left: isPt ? 'calc(50% + 1px)' : '2px',
        }}
      />
    </div>
  );
};
