# Contributing to FlyLabs

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/fly-labs/website.git
   cd website
   ```

2. **Install dependencies:**
   ```bash
   nvm use        # Node 20.19.1 (see .nvmrc)
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp apps/web/.env.example apps/web/.env
   # Fill in your Supabase and GA4 keys (see README for details)
   ```

4. **Start the dev server:**
   ```bash
   npm run dev    # http://localhost:3001
   ```

## Code Style

- **JSX only** - no TypeScript
- **Always include `.jsx` extension** in imports
- **Tailwind CSS** for styling, `cn()` for conditional classes
- **Path alias:** `@/` maps to `src/`
- **No em dashes** in text or docs
- Refer to `CLAUDE.md` for the full coding conventions

## Making Changes

1. Create a branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run build` to verify
4. Test at 375px width (iPhone SE) in DevTools
5. Open a pull request

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what and why
- Ensure lint and build pass
- Follow existing code patterns and conventions

## Reporting Issues

- Use the bug report or feature request templates
- Include reproduction steps for bugs
- Search existing issues before creating new ones
