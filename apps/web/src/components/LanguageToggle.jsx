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
      className="relative flex items-center bg-muted/60 rounded-full p-[3px] gap-0 border border-border/50"
      role="radiogroup"
      aria-label="Language"
    >
      <button
        onClick={() => switchTo('en')}
        className={`relative z-10 min-w-[36px] py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
          !isPt
            ? 'text-foreground'
            : 'text-muted-foreground/50 hover:text-muted-foreground'
        }`}
        role="radio"
        aria-checked={!isPt}
        aria-label="English"
      >
        EN
      </button>
      <button
        onClick={() => switchTo('pt-BR')}
        className={`relative z-10 min-w-[36px] py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
          isPt
            ? 'text-foreground'
            : 'text-muted-foreground/50 hover:text-muted-foreground'
        }`}
        role="radio"
        aria-checked={isPt}
        aria-label="Português"
      >
        PT
      </button>
      {/* Sliding pill */}
      <div
        className="absolute top-[3px] bottom-[3px] rounded-full bg-background shadow-sm border border-border/80 transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          width: '36px',
          left: isPt ? 'calc(100% - 36px - 3px)' : '3px',
        }}
      />
    </div>
  );
};
