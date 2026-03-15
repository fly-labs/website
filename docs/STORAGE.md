# Fly Labs Storage & Capacity Dashboard

Last updated: 2026-03-15

## Supabase Free Tier Limits

| Resource | Limit | Current (est.) | 12-month projection | Status |
|----------|-------|----------------|---------------------|--------|
| Database | 500 MB | ~50-80 MB | ~200-300 MB | OK |
| Storage | 1 GB | ~0 MB (music moved to R2) | ~20-50 MB | OK |
| Bandwidth | 5 GB/month | ~0.5-1 GB/mo | ~2-3 GB/mo | OK |
| Auth MAU | 50,000 | ~50 | ~500 | OK for years |
| Edge Functions | 500K/month | minimal | minimal | OK for years |

Run baseline SQL in Supabase dashboard to get exact numbers:

```sql
-- Total database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes (data + indexes)
SELECT
  schemaname || '.' || tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS data_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Row counts
SELECT 'ideas' AS t, COUNT(*) FROM ideas
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'boards', COUNT(*) FROM boards
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles;

-- Average idea row size
SELECT pg_size_pretty(AVG(pg_column_size(t.*))::bigint) AS avg_row_size FROM ideas t;
```

## Cloudflare R2 (Music Storage)

| Metric | Value |
|--------|-------|
| Bucket | flylabs-music |
| Total tracks | 50 |
| Total size | 156.3 MB |
| R2 free tier | 10 GB storage, 10M reads/month |
| Headroom | 9.8 GB remaining (98% free) |
| Egress cost | $0 (R2 has zero egress fees) |

### Per-vibe breakdown

| Vibe | Tracks | Size | Description |
|------|--------|------|-------------|
| Ideate | 10 | 27 MB | Upbeat beats to spark ideas |
| Build | 10 | 32 MB | Driving rhythms for deep work |
| Create | 10 | 28 MB | Warm beats for writing and creating |
| Study | 10 | 40 MB | Calm sounds for reading and learning |
| Retro | 10 | 30 MB | Chiptune beats and 8-bit nostalgia |

Max allowed: 250 MB total. Current usage: 62.5%.

## Optimizations Active

### 1. Music on Cloudflare R2 (not Supabase)
- Saves ~156 MB Supabase storage (was 50% of limit, now 0%)
- Saves ~900 MB/month Supabase bandwidth (10 plays/day at ~3 MB each)
- Files served with `Cache-Control: public, max-age=31536000, immutable`
- Public URL: r2.dev subdomain (upgrade to custom domain when traffic grows)

### 2. FlyBot analytics caching (coach-prompt.js)
- `fetchIdeaAnalytics()`: 5-minute TTL in-memory cache
- `findSimilarIdeas()`: 3-minute TTL per keyword set, LRU eviction at 50 entries
- Saves ~250 MB/month bandwidth at scale (was ~500 KB per chat message)

### 3. Board scene compression (useBoard.js)
- `compressSceneData()` strips regenerable Excalidraw fields before save
- Removes: versionNonce, seed, version, and default values (opacity=100, angle=0, etc.)
- Saves ~20-40% per board row in database

### 4. CSP headers (vercel.json)
- `media-src` allows `*.r2.dev` and `*.cloudflare.com` for R2 audio

## Growth Triggers (When to Act)

| Trigger | Action | Cost |
|---------|--------|------|
| Database > 400 MB | Upgrade to Supabase Pro | $25/month |
| Music > 250 MB | Add more R2 storage (free up to 10 GB) | $0 |
| Bandwidth > 4 GB/month | Check query patterns, add more caching | $0 |
| R2 rate limits hit | Connect custom domain (music.flylabs.fun) | $0 |
| R2 reads > 10M/month | Pay-as-you-go ($0.36/M reads) | ~$3.60 |

## Files Involved

| File | Role |
|------|------|
| `scripts/setup-music.mjs` | Uploads MP3s to R2, generates tracks.js |
| `apps/web/src/lib/data/tracks.js` | Auto-generated track data with R2 URLs |
| `apps/web/api/lib/coach-prompt.js` | FlyBot prompt builder with TTL caches |
| `apps/web/src/hooks/useBoard.js` | Board save with scene compression |
| `apps/web/vercel.json` | Security headers including R2 in CSP |
| `apps/web/.env.example` | R2 env vars documented |

## Env Vars for R2

```
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=flylabs-music
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

Also add to GitHub Actions secrets for CI/CD if you run `setup:music` in workflows.
