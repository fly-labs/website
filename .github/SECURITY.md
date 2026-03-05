# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@flylabs.fun**

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment:** within 72 hours
- **Status update:** within 7 days
- **Fix timeline:** depends on severity, typically within 30 days

### Scope

This policy covers the FlyLabs website codebase and its deployed instance at flylabs.fun.

Out of scope:
- Third-party services (Supabase, Vercel, Google Analytics)
- Social engineering
- Denial of service

## Supported Versions

Only the latest version deployed on `main` is supported with security updates.

## Security Measures

- Row Level Security (RLS) on all Supabase tables
- CSP, COOP, HSTS, and Permissions-Policy headers (see `vercel.json`)
- No secrets committed to git (`.env` is gitignored)
- Input validation on all user-facing forms
