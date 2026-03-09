export const books = [
  {
    id: 'ai-builders-guide',
    title: "The AI Builder's Guide",
    description: 'What I learned building with AI every day. Tools, workflows, and honest takes.',
    topic: 'AI',
    status: 'coming_soon',
    coverColor: 'primary',
    downloadUrl: null,
    pageCount: null,
  },
  {
    id: 'validate-microsaas-ideas',
    title: 'How to Find and Validate Micro-SaaS Ideas with AI',
    description: 'The complete playbook for discovering, scoring, and validating business ideas. 7 sources, 4 frameworks (Fly Labs Method + 3 expert perspectives), real validation from X and Reddit, competitive analysis.',
    topic: 'Business',
    status: 'coming_soon',
    coverColor: 'accent',
    downloadUrl: null,
    pageCount: null,
  },
];

export const topics = ['All', 'AI', 'Business', 'Mindset', 'Mindfulness', 'Random'];

export const topicColors = {
  AI: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  Business: { text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  Mindset: { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  Mindfulness: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  Random: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
};
