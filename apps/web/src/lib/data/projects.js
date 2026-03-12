import { Sparkles, LayoutTemplate, Mail, Code, Lightbulb, Globe, ListChecks, FileText, BookOpen } from 'lucide-react';
import { SOURCE_COUNT } from '@/lib/data/ideas.js';

export const categories = ['All', 'Business', 'Tools', 'Learn'];


export const projects = [
  {
    title: 'Website Blueprint',
    description: 'The full stack breakdown of how this site was built. React, Supabase, Tailwind, Vercel. Fork it, learn from it, make it yours.',
    icon: Globe,
    link: '/templates/website-blueprint',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    type: 'Development',
    status: 'Live',
    category: 'Tools',

  },
  {
    title: 'Prompt Library',
    description: 'The prompts I actually use every day for coding, writing, and thinking. Tested, tweaked, copy-paste ready.',
    icon: Sparkles,
    link: '/prompts',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    type: 'AI',
    status: 'Live',
    category: 'Tools',
    isGated: true,

  },
  {
    title: 'Micro Tools',
    description: 'Small apps that do one thing really well. No sign-ups, no bloat. Built because I needed them, now you can use them too.',
    icon: Code,
    link: '/microsaas',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    type: 'Tools',
    status: 'Beta',
    category: 'Tools',

  },
  {
    title: 'Launch Checklist',
    description: 'From zero to launched in one Notion template. Every step mapped out so you know what to do next.',
    icon: ListChecks,
    link: '/templates/launch-checklist',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    type: 'Notion',
    status: 'Soon',
    category: 'Business',

  },
  {
    title: 'One-Page Business Plan',
    description: 'Five questions that force clarity on what you\'re building, who it\'s for, and why it matters. One page, no fluff.',
    icon: FileText,
    link: '/templates/one-page-business-plan',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    type: 'Notion',
    status: 'Soon',
    category: 'Business',

  },
  {
    title: 'Garmin to Notion',
    description: 'The project that started everything. I wanted my Garmin data in Notion, nothing existed, so I built it. Now it runs automatically every day.',
    icon: LayoutTemplate,
    link: '/templates/garmin-to-notion',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    type: 'Notion',
    status: 'Live',
    category: 'Tools',

  },
  {
    title: 'The Newsletter',
    description: 'Where I write about what I\'m building, what breaks, and what I learn along the way. The honest version.',
    icon: Mail,
    link: '/newsletter',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    type: 'Newsletter',
    status: 'Live',
    category: 'Learn',

  },
  {
    title: 'Library',
    description: 'Free ebooks distilled from hundreds of hours of reading. AI, business, mindset. What I learned, written for people who build.',
    icon: BookOpen,
    link: '/library',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    type: 'Ebooks',
    status: 'Live',
    category: 'Learn',

  },
  {
    title: 'Idea Lab',
    description: `The hardest part of building is knowing what to build. This system pulls real problems from ${SOURCE_COUNT} sources, scores them with 4 AI frameworks, and validates against real market conversations. The best ones get built.`,
    icon: Lightbulb,
    link: '/ideas',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    type: 'Ideas',
    status: 'Live',
    category: 'Business',

  },
];
