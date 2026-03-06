import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const industryKeywords = {
  'Ai': ['ai', 'chatgpt', 'llm', 'machine learning', 'prompt', 'gpt', 'claude', 'openai'],
  'Dev': ['code', 'developer', 'programming', 'api', 'github', 'deploy', 'debug', 'software', 'app'],
  'Productivity': ['notion', 'automation', 'workflow', 'template', 'organize', 'task', 'productivity'],
  'Marketing Sales': ['marketing', 'sales', 'seo', 'ads', 'conversion', 'funnel', 'landing page'],
  'Finance': ['finance', 'budget', 'invest', 'money', 'tax', 'accounting', 'payment'],
  'Education': ['learn', 'course', 'tutorial', 'teach', 'student', 'education'],
  'Design Creative': ['design', 'ui', 'ux', 'figma', 'creative', 'brand', 'logo'],
  'Medicine Health': ['health', 'medical', 'fitness', 'wellness', 'mental health', 'therapy'],
  'Business': ['business', 'startup', 'entrepreneur', 'company', 'revenue', 'saas'],
  'Sport Fitness': ['sport', 'fitness', 'workout', 'garmin', 'exercise', 'training'],
  'Media': ['media', 'content', 'video', 'podcast', 'newsletter', 'blog'],
  'Food Nutrition': ['food', 'nutrition', 'recipe', 'meal', 'diet', 'restaurant'],
  'Travel': ['travel', 'trip', 'booking', 'hotel', 'flight'],
  'Freelance': ['freelance', 'freelancer', 'contract', 'client'],
  'Hr Career': ['hr', 'career', 'hiring', 'resume', 'job', 'interview'],
  'Realty': ['real estate', 'property', 'rent', 'housing'],
  'Legal': ['legal', 'lawyer', 'law', 'contract', 'compliance'],
  'Retail': ['retail', 'ecommerce', 'shop', 'store', 'inventory'],
  'No Code': ['no-code', 'nocode', 'no code', 'zapier', 'bubble'],
};

function classifyIndustry(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return industry;
    }
  }
  return 'Other';
}

// Fetch community ideas without an industry
const { data: ideas, error } = await supabase
  .from('ideas')
  .select('id, idea_title, idea_description')
  .or('source.eq.community,source.is.null')
  .is('industry', null);

if (error) {
  console.error('Fetch error:', error.message);
  process.exit(1);
}

console.log(`Found ${ideas.length} community ideas to classify.`);

let updated = 0;
for (const idea of ideas) {
  const industry = classifyIndustry(idea.idea_title, idea.idea_description);
  const { error: updateError } = await supabase
    .from('ideas')
    .update({ industry })
    .eq('id', idea.id);

  if (updateError) {
    console.error(`Failed to update idea ${idea.id}:`, updateError.message);
  } else {
    updated++;
  }
}

console.log(`Done. Classified ${updated}/${ideas.length} ideas.`);
