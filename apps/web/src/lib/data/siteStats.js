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

// Architectural constants (update when codebase changes)
// These describe the codebase itself and can't be auto-computed at runtime.
// Centralized here so there's ONE place to update.
export const ROUTE_COUNT = 24;
export const SCRIPT_COUNT = 11;
export const GA4_EVENT_COUNT = 35;
export const DB_TABLE_COUNT = 9;
export const RPC_COUNT = 7;
export const WORKFLOW_COUNT = 3;
export const EXPERT_COUNT = 3; // Hormozi, Dan Koe, Okamoto
