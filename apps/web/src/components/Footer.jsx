import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Youtube, Linkedin, Mail, BookOpen } from 'lucide-react';
import { XIcon } from '@/components/XIcon.jsx';

const footerLinks = [
  { name: 'Explore', path: '/explore' },
  { name: 'Newsletter', path: '/newsletter' },
  { name: 'Ideas', path: '/ideas' },
  { name: 'About', path: '/about' },
];

const socialLinks = [
  { href: 'https://falacomigo.substack.com', icon: BookOpen, label: 'Substack' },
  { href: 'https://github.com/fly-labs', icon: Github, label: 'GitHub' },
  { href: 'https://x.com/alvesluizc', icon: XIcon, label: 'X' },
  { href: 'https://youtube.com/@falacomigoyt', icon: Youtube, label: 'YouTube' },
  { href: 'https://br.linkedin.com/in/alvesluizc', icon: Linkedin, label: 'LinkedIn' },
  { href: 'mailto:luiz@flylabs.fun', icon: Mail, label: 'Email' },
];

const Footer = () => {
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
              >
                <link.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-8 text-center md:text-left text-sm text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} Fly Labs. Vibe building things I wish existed.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
