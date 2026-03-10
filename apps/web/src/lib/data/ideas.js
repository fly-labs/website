export const categories = [
  { value: 'Tool', label: 'Tool' },
  { value: 'Template', label: 'Template' },
  { value: 'Prompt', label: 'Prompt' },
  { value: 'Article', label: 'Article' },
  { value: 'Other', label: 'Other' },
];

export const industries = [
  { value: 'Marketing Sales', label: 'Marketing & Sales' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Medicine Health', label: 'Medicine & Health' },
  { value: 'Business', label: 'Business' },
  { value: 'Realty', label: 'Real Estate' },
  { value: 'Productivity', label: 'Productivity' },
  { value: 'Education', label: 'Education' },
  { value: 'Hr Career', label: 'HR & Career' },
  { value: 'Ai', label: 'AI' },
  { value: 'Sport Fitness', label: 'Sport & Fitness' },
  { value: 'Ecommerce', label: 'E-Commerce' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Dev', label: 'Dev' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Media', label: 'Media' },
  { value: 'Food Nutrition', label: 'Food & Nutrition' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Vc Startups', label: 'VC & Startups' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Logistics Delivery', label: 'Logistics & Delivery' },
  { value: 'Psychology', label: 'Psychology' },
  { value: 'Design Creative', label: 'Design & Creative' },
  { value: 'Immigration', label: 'Immigration' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Dating Community', label: 'Dating & Community' },
  { value: 'Seo Geo', label: 'SEO & Geo' },
  { value: 'Agtech', label: 'AgTech' },
  { value: 'No Code', label: 'No-Code' },
  { value: 'Other', label: 'Other' },
];

export const statusConfig = {
  open: { label: 'Open', className: 'bg-orange-500/10 text-orange-500' },
  building: { label: 'Building', className: 'bg-blue-500/10 text-blue-500' },
  shipped: { label: 'Shipped', className: 'bg-primary/10 text-primary' },
};

export const sortOptions = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'top', label: 'Top Voted' },
  { value: 'flylabs', label: 'Fly Labs Score' },
  { value: 'hormozi', label: 'Hormozi Score' },
  { value: 'koe', label: 'Koe Score' },
  { value: 'okamoto', label: 'Okamoto Score' },
  { value: 'validation', label: 'Validation' },
  { value: 'verdict', label: 'Verdict' },
];

export const sourceOptions = [
  { value: 'all', label: 'All' },
  { value: 'community', label: 'Community' },
  { value: 'problemhunt', label: 'ProblemHunt' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'producthunt', label: 'Product Hunt' },
  { value: 'x', label: 'X' },
  { value: 'hackernews', label: 'Hacker News' },
  { value: 'github', label: 'GitHub' },
  { value: 'yc', label: 'YC Graveyard' },
];

export const verdictOptions = [
  { value: 'all', label: 'All' },
  { value: 'BUILD', label: 'BUILD' },
  { value: 'VALIDATE_FIRST', label: 'VALIDATE' },
  { value: 'SKIP', label: 'SKIP' },
];

export const scoreThresholds = [
  { value: 0, label: 'All' },
  { value: 40, label: '\u226540' },
  { value: 60, label: '\u226560' },
  { value: 75, label: '\u226575' },
];

export const confidenceOptions = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const perPageOptions = [5, 10, 20, 50];

export const frequencyOptions = ['Daily', 'Weekly', 'Sometimes', 'Once'];

export const formSteps = [
  { id: 'problem', label: 'The Problem' },
  { id: 'context', label: 'Context' },
  { id: 'you', label: 'About You' },
];

export const verdictColors = {
  BUILD: 'bg-primary/10 text-primary border-primary/30',
  VALIDATE_FIRST: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  SKIP: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export const verdictLabels = {
  BUILD: 'BUILD',
  VALIDATE_FIRST: 'VALIDATE',
  SKIP: 'SKIP',
};

export const SOURCE_COUNT = sourceOptions.filter(s => s.value !== 'all').length;
