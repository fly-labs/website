# FlyLabs Website - Development Guide

## Project Overview
**FlyLabs** (flylabs.fun) - "The playground for creators. Tools, templates, and experiments."
A React SPA built by Luiz Alves. Community-facing site with public pages (explore, ideas, newsletter, about), hybrid public/gated pages (prompts, micro tools), and member-only areas (templates, profile).

## Quick Start
```bash
cd /Users/luiz/Negócios/FlyLabs/Website
npm run dev      # Dev server on http://localhost:3001
npm run build    # Production build (Vite)
npm run lint     # ESLint (quiet mode)
```

## Tech Stack
- **Framework:** React 18 + Vite 7 (JSX, no TypeScript)
- **Styling:** Tailwind CSS 3.4 + CSS variables (HSL) for theming
- **Components:** shadcn/ui pattern (Radix UI primitives + CVA variants) in `components/ui/`
- **Routing:** React Router DOM v7 (client-side SPA)
- **Animation:** Framer Motion 11
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Auth:** Email/password + Google OAuth via Supabase
- **SEO:** React Helmet + JSON-LD
- **Analytics:** Google Analytics 4 (gtag)
- **Deploy:** Vercel (auto-deploy on push to `main`)

## Project Structure
```
apps/web/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Router + providers (AuthProvider, ThemeProvider)
│   ├── index.css             # Tailwind base + design tokens (CSS vars)
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (button, avatar, tabs, toast...)
│   │   ├── Header.jsx        # Nav bar (sticky, blur backdrop)
│   │   ├── Footer.jsx        # Footer with social links
│   │   ├── SEO.jsx           # Helmet wrapper
│   │   ├── PageLayout.jsx    # Page wrapper (SEO, Header, Footer, background)
│   │   ├── ErrorBoundary.jsx # Error boundary fallback
│   │   ├── AuthModal.jsx     # Login/signup modal
│   │   ├── ProtectedRoute.jsx
│   │   ├── ThemeToggle.jsx   # Dark/light switch
│   │   ├── GoogleIcon.jsx    # Shared Google "G" SVG
│   │   ├── XIcon.jsx         # X/Twitter icon
│   │   ├── GeometricBackground.jsx  # Hand-drawn doodle background
│   │   ├── GridBackground.jsx       # Subtle 32px graph-paper grid
│   │   ├── GitHubHeatmap.jsx        # GitHub contribution heatmap
│   │   ├── SmileLogo.jsx     # Animated brand logo
│   │   └── ScrollToTop.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Supabase auth state
│   │   └── ThemeContext.jsx  # Dark/light mode
│   ├── hooks/
│   │   └── use-toast.js
│   ├── lib/
│   │   ├── data/
│   │   │   ├── projects.js       # Shared projects array
│   │   │   ├── prompts.js        # Prompts data (featured flag for lead magnet)
│   │   │   └── ideas.js          # Idea categories, status config, sort options
│   │   ├── supabaseClient.js # Supabase init
│   │   ├── analytics.js      # GA4 helpers
│   │   ├── animations.js     # Shared animation variants (fadeUp)
│   │   ├── githubApi.js      # GitHub contribution API
│   │   └── utils.js          # cn() helper (clsx + tailwind-merge), timeAgo()
│   └── pages/
│       ├── HomePage.jsx
│       ├── ExplorePage.jsx
│       ├── IdeaSubmissionPage.jsx
│       ├── NewsletterPage.jsx
│       ├── AboutPage.jsx
│       ├── LoginPage.jsx
│       ├── SignupPage.jsx
│       ├── PromptsPage.jsx        # Hybrid: 5 free / full library for members
│       ├── NotionTemplatesPage.jsx # Protected
│       ├── GarminToNotionPage.jsx  # Protected
│       ├── MicroSaasPage.jsx       # Public with waitlist capture
│       ├── ProfilePage.jsx         # Protected
│       └── NotFoundPage.jsx
├── public/
│   ├── images/luiz-alves.png
│   ├── robots.txt
│   └── sitemap.xml
├── vite.config.js           # Port 3001, @ alias -> ./src
├── tailwind.config.js       # Design tokens, dark mode: 'class'
├── components.json          # shadcn/ui: new-york style, JSX, lucide icons
├── vercel.json              # SPA rewrites + security headers
└── .env                     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GA_ID
```

## Routes
| Path | Page | Auth |
|------|------|------|
| `/` | HomePage | Public |
| `/explore` | ExplorePage | Public |
| `/ideas` | IdeaSubmissionPage | Public |
| `/newsletter` | NewsletterPage | Public |
| `/about` | AboutPage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/prompts` | PromptsPage | Hybrid (5 free public, full library for members) |
| `/microsaas` | MicroSaasPage | Public (waitlist capture) |
| `/templates` | NotionTemplatesPage | Protected |
| `/templates/garmin-to-notion` | GarminToNotionPage | Protected |
| `/profile` | ProfilePage | Protected |

## Supabase Tables
- **profiles** - User profiles (synced with auth)
- **ideas** - Community idea submissions with voting
- **prompt_votes** - Upvotes on prompts (RPC: toggle_prompt_vote)
- **prompt_comments** - Comments on prompts
- **waitlist** - Email waitlist capture (source: 'micro-tools')

## Design System
**Colors (HSL via CSS vars, light/dark themes in index.css):**
- **Primary:** Vibrant green `hsl(120 100% 40%)` / `hsl(120 100% 50%)` dark
- **Secondary:** Vibrant cyan `hsl(180 100% 40%)` / `hsl(180 100% 50%)` dark
- **Accent:** Magenta `hsl(300 100% 50%)`
- **Background:** White / Very dark blue `hsl(240 10% 3.9%)`
- **Foreground:** Near-black / Off-white

**Font:** Nunito (primary), Inter (fallback), system-ui

**Radius:** 0.75rem base (--radius)

**Custom classes:** `.btn-playful`, `.btn-playful-primary`, `.card-playful` (in index.css)

## Coding Conventions
- **JSX only** - no TypeScript, no `.tsx` files
- **Path alias:** `@/` maps to `src/` (e.g., `import Header from '@/components/Header.jsx'`)
- **Always include `.jsx` extension** in imports
- **Component naming:** PascalCase files, default exports for pages, named exports for utilities
- **Styling:** Tailwind utility classes. Use `cn()` from `@/lib/utils.js` for conditional classes
- **Animation:** Framer Motion `motion.div` with `initial/animate/exit`. Use `AnimatePresence` for mount/unmount
- **Icons:** Import individually from `lucide-react` (tree-shakeable)
- **Pages:** Always include `<SEO>` component, `<Header>`, `<Footer>`, background component
- **Protected pages:** Wrap content in `<ProtectedRoute>` or check auth + show `<AuthModal>`
- **Hybrid pages:** Use `useAuth()` to render different content for guests vs members (e.g., PromptsPage)
- **State:** Local state (`useState`) for UI, Context for auth/theme. No Redux or external state lib
- **Supabase:** Use `supabase` client from `@/lib/supabaseClient.js`. RPC for atomic operations
- **No em dashes:** Never use the em dash character in text or documentation. Use periods, colons, or hyphens instead
- **Homepage:** Uses a local `pillars` array for generic category cards (distinct from the `projects` array in `lib/data/projects.js`). Sections use varied container widths (hero max-w-4xl, pillars max-w-6xl with 4-col grid on lg, about/newsletter max-w-5xl) and varied vertical rhythm

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GA_ID=G-XXXXXXXXXX
```

## Git
- **Main branch:** `main` (auto-deploys to Vercel)
- **Node version:** 20.19.1 (see .nvmrc)
