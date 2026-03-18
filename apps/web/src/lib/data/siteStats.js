import { prompts } from '@/lib/data/prompts.js';
import { SOURCE_COUNT } from '@/lib/data/ideas.js';
import { books } from '@/lib/data/library.js';
import { projects } from '@/lib/data/projects.js';
import { tracks, vibes, VIBE_COUNT } from '@/lib/data/tracks.js';

// Computed from data arrays (auto-sync)
export const PROMPT_COUNT = prompts.length;
export const PROMPT_CATEGORIES = [...new Set(prompts.map(p => p.category))];
export const CATEGORY_COUNT = PROMPT_CATEGORIES.length;
export const CATEGORY_LIST = PROMPT_CATEGORIES.join(', ');
export const BOOK_COUNT = books.filter(b => b.status === 'available').length;
export const TEMPLATE_COUNT = projects.filter(p => ['Live', 'Beta'].includes(p.status) && p.type !== 'Newsletter' && p.type !== 'Ebooks' && p.type !== 'Ideas').length;
export const TRACK_COUNT = tracks.length;
export { VIBE_COUNT };

// Re-export for convenience
export { SOURCE_COUNT };

// Re-export shared constant
export { FRAMEWORK_COUNT } from '@/lib/data/constants.js';

// The 4 questions that decide the score
export const QUESTION_COUNT = 4;

// Expert and scoring constants
export const EXPERT_COUNT = 4; // Hormozi, Dan Koe, Okamoto, YC Lens
export const YC_QUESTION_COUNT = 6;
