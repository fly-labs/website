import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Youtube, Linkedin, Mail, BookOpen } from 'lucide-react';
import { XIcon } from '@/components/XIcon.jsx';
import { trackEvent } from '@/lib/analytics.js';
import { useTranslation } from 'react-i18next';

const socialLinks = [
  { href: 'https://falacomigo.substack.com', icon: BookOpen, label: 'Substack' },
  { href: 'https://github.com/fly-labs', icon: Github, label: 'GitHub' },
  { href: 'https://x.com/alvesluizc', icon: XIcon, label: 'X' },
  { href: 'https://youtube.com/@falacomigoyt', icon: Youtube, label: 'YouTube' },
  { href: 'https://br.linkedin.com/in/alvesluizc', icon: Linkedin, label: 'LinkedIn' },
  { href: 'mailto:luiz@flylabs.fun', icon: Mail, label: 'Email' },
];

const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = [
    { name: t('nav.explore'), path: '/explore' },
    { name: t('nav.ideas'), path: '/ideas' },
    { name: t('nav.prompts'), path: '/prompts' },
    { name: t('nav.newsletter'), path: '/newsletter' },
    { name: t('nav.library'), path: '/library' },
    { name: t('nav.about'), path: '/about' },
  ];

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-12 mt-auto relative z-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-xl font-black tracking-tight">Fly Labs</span>
            <nav className="flex flex-wrap justify-center gap-4">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('mailto') ? undefined : '_blank'}
                rel={link.href.startsWith('mailto') ? undefined : 'noreferrer'}
                className="p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label={link.label}
                onClick={() => trackEvent('outbound_click', { link_url: link.href, link_label: link.label, location: 'footer' })}
              >
                <link.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-between gap-2 text-sm text-muted-foreground font-medium">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            onClick={() => trackEvent('outbound_click', { link_url: 'https://claude.ai', link_label: 'Built with Claude', location: 'footer' })}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.308 6.068a2.22 2.22 0 0 0-.75-.09c-1.673 0-3.558 1.164-5.307 3.034-1.086-1.1-2.095-1.78-3.042-2.058a2.556 2.556 0 0 0-.716-.104c-.692 0-1.256.376-1.63 1.014-.656 1.12-.653 3.05.25 5.136-1.886.904-3.113 2.125-3.113 3.542 0 .568.188 1.09.557 1.527.92 1.09 2.985 1.556 5.39 1.322a13.1 13.1 0 0 0 .88-.116c.28.87.614 1.64 1.004 2.26.473.755 1.012 1.215 1.587 1.345a1.3 1.3 0 0 0 .296.034c.596 0 1.136-.39 1.614-1.1.45-.669.836-1.59 1.142-2.66 1.105.084 2.16.032 3.07-.17 1.34-.296 2.36-.9 2.87-1.756.26-.434.38-.903.38-1.385 0-1.172-.84-2.268-2.274-3.127.384-1.35.493-2.6.3-3.593-.173-.886-.564-1.568-1.16-1.948a1.79 1.79 0 0 0-.348-.188zm-.342 1.17c.266.112.51.38.656.86.16.519.178 1.22.03 2.074a12.9 12.9 0 0 0-.14.9c-.553-.243-1.15-.467-1.787-.667a18.4 18.4 0 0 0-1.264-1.848c1.4-1.46 2.787-2.314 3.836-1.524a.66.66 0 0 1 .093.068l.004.002-.002-.002.574.137zm-2.156 3.862a16.07 16.07 0 0 1-.804 1.378 16 16 0 0 1-.87 1.212 16.2 16.2 0 0 1-1.47.04 16.8 16.8 0 0 1-1.47-.08 16.5 16.5 0 0 1-.838-1.19 16.4 16.4 0 0 1-.772-1.356c.243-.48.507-.96.794-1.42a16.8 16.8 0 0 1 .87-1.26c.472-.03.963-.05 1.464-.05.504 0 .993.02 1.462.05.316.4.61.82.882 1.254.27.435.52.88.752 1.33v.092zm-1.09-3.12c.26.34.513.694.756 1.058a18.4 18.4 0 0 0-1.51-.064 18.4 18.4 0 0 0-1.49.066 14 14 0 0 1 .73-1.04c.495-.628.99-1.1 1.468-1.39l.046.026v-.002c.004.002-.004.002 0 .006a14 14 0 0 0-.002.006l.002.002v-.002-.002c.002 0 0-.002 0 0v.004l-.002-.002.002.002zm-3.844-.94c.514.162 1.08.5 1.686.988a18.7 18.7 0 0 0-1.25 1.826 18 18 0 0 0-1.793.65c-.583-1.386-.722-2.636-.34-3.29.108-.184.254-.28.42-.28a.6.6 0 0 1 .168.024h.002l.001.002h.002v-.002l.002.002c.358.082.728.08 1.102.08zm-2.128 4.476c.082-.25.176-.504.28-.76.155.37.324.742.508 1.116.184.373.377.736.577 1.088a18.3 18.3 0 0 0-1.542.27c-.268-.646-.42-1.236-.42-1.74v-.002c.192-.014.39-.014.597.028zm.236 2.674c-.148.026-.296.048-.44.064-1.902.214-3.404-.088-3.928-.706a.7.7 0 0 1-.167-.44c0-.632.696-1.41 1.918-2.072l.164-.086c.374.776.823 1.568 1.34 2.35a13 13 0 0 0 1.113 1.39v-.002l-.002.002h.002v-.002l-.002.002h.002zm3.59 3.988c-.24.384-.494.604-.728.604h-.04c-.174-.04-.396-.256-.622-.616a10 10 0 0 1-.686-1.47c.47-.098.97-.212 1.49-.346.256-.066.504-.136.744-.21a12 12 0 0 1-.158 2.038zm3.56-2.78c-.65.142-1.392.214-2.162.224.286-.362.566-.744.836-1.148a18 18 0 0 0 .788-1.348c.45.172.872.356 1.262.554.98.496 1.62 1.076 1.62 1.586 0 .148-.04.296-.12.438-.232.406-.82.742-1.666.934l-.558-.24z"/>
            </svg>
            {t('footer.builtWith')}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
