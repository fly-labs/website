# Contributing to Fly Labs

Thanks for your interest in contributing. This project is built and maintained by one person, but contributions are welcome.

## How to contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. Run `npm run build` and `npm run lint` to verify
5. Commit with a clear message
6. Open a pull request

## Development setup

```bash
npm install
npm run dev  # http://localhost:3001
```

## Guidelines

- JSX only, no TypeScript
- Tailwind CSS for styling, use `cn()` for conditional classes
- Recharts for data visualizations (lazy-loaded, separate vendor chunk)
- No gradient text effects, no glow orbs
- Mobile-first responsive design (test at 375px)
- No `transition-all` on tappable elements
- Include `.jsx` extension in all imports

## Reporting bugs

Use the [bug report template](https://github.com/fly-labs/website/issues/new?template=bug_report.md).

## Questions?

Open an issue or reach out at luiz@flylabs.fun.
