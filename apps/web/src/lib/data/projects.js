import { Sparkles, LayoutTemplate, Mail, Code, Lightbulb, Globe, ListChecks, FileText, BookOpen } from 'lucide-react';

export const categories = ['All', 'Business', 'Tools', 'Learn'];


export const projects = [
  {
    title: 'Website Blueprint',
    description: 'See exactly how I built this site. Full stack breakdown, open source, and free to fork.',
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
    description: 'Stop staring at a blank prompt. Copy-paste AI prompts for shipping code faster, writing better, and thinking clearer.',
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
    description: 'Small apps that do one thing really well. No bloat, no features you don\'t need. The first batch is cooking now.',
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
    description: 'A step-by-step Notion template to take your idea from zero to launched. Based on The $100 Startup framework.',
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
    description: 'Answer five questions. Get clarity on your entire business. A Notion template inspired by The $100 Startup.',
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
    description: 'Never manually log a workout again. Your Garmin data flows into Notion every day: steps, sleep, heart rate, workouts.',
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
    description: 'Money, career, and building products. Written in English and Portuguese for builders who refuse to stay still.',
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
    description: 'Free ebooks from study notes. AI, business, mindset, and everything in between. Written for builders.',
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
    description: 'Real problems from Reddit, ProblemHunt, Product Hunt, and the community. AI-scored and validated. The best ones get built.',
    icon: Lightbulb,
    link: '/ideas',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    type: 'Ideas',
    status: 'Live',
    category: 'Business',

  },
];
