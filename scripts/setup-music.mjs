/**
 * Music Setup Script
 *
 * Uploads MP3 files from scripts/music/{vibe}/ subfolders to Cloudflare R2
 * (S3-compatible, zero egress fees), then auto-generates
 * apps/web/src/lib/data/tracks.js with public URLs.
 *
 * Usage:
 *   1. Place CC0/royalty-free MP3s in scripts/music/{ideate,build,create,study,retro}/
 *   2. Set R2 env vars in apps/web/.env (see below)
 *   3. Run: npm run setup:music
 *
 * Required env vars (in apps/web/.env):
 *   R2_ACCOUNT_ID=your-cloudflare-account-id
 *   R2_ACCESS_KEY_ID=your-r2-access-key
 *   R2_SECRET_ACCESS_KEY=your-r2-secret-key
 *   R2_BUCKET_NAME=flylabs-music
 *   R2_PUBLIC_URL=https://pub-xxx.r2.dev (or custom domain)
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from apps/web/.env
const envPath = join(__dirname, '..', 'apps', 'web', '.env');
if (!existsSync(envPath)) {
  console.error('Missing apps/web/.env file. Copy .env.example and fill in values.');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

// R2 config (required)
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME || 'flylabs-music';
const R2_PUBLIC_URL = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
  console.error('Missing R2 credentials. Set these in apps/web/.env:');
  console.error('  R2_ACCOUNT_ID=your-cloudflare-account-id');
  console.error('  R2_ACCESS_KEY_ID=your-r2-access-key');
  console.error('  R2_SECRET_ACCESS_KEY=your-r2-secret-key');
  console.error('  R2_BUCKET_NAME=flylabs-music');
  console.error('  R2_PUBLIC_URL=https://pub-xxx.r2.dev');
  process.exit(1);
}

const MUSIC_DIR = join(__dirname, 'music');
const TRACKS_OUTPUT = join(__dirname, '..', 'apps', 'web', 'src', 'lib', 'data', 'tracks.js');

const VIBE_CONFIG = [
  { id: 'ideate', name: 'Ideate', description: 'Brainstorm mode. Upbeat beats to spark ideas.', icon: 'Lightbulb' },
  { id: 'build', name: 'Build', description: 'Flow state. Driving rhythms for deep work.', icon: 'Hammer' },
  { id: 'create', name: 'Create', description: 'Cozy vibes. Warm beats for writing and creating.', icon: 'PenLine' },
  { id: 'cafe', name: 'Cafe', description: 'Cozy piano. Starbucks on a rainy afternoon.', icon: 'Coffee' },
  { id: 'study', name: 'Study', description: 'Focus mode. Calm sounds for reading and learning.', icon: 'BookOpen' },
  { id: 'retro', name: 'Retro', description: 'Synthwave and retro beats. Late 2000s lan house energy.', icon: 'Gamepad2' },
];

const MAX_TOTAL_SIZE_MB = 500;

/**
 * Parse a filename like "01-chill-lofi-beats--artist-name.mp3" into title + artist
 * Convention: number-title-words--artist-words.mp3 (double dash separates artist)
 */
function toTitleCase(str) {
  const minor = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'in', 'on', 'at', 'to', 'by', 'of', 'with']);
  return str.split(' ').map((word, i) => {
    if (i === 0 || !minor.has(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word.toLowerCase();
  }).join(' ');
}

function parseFilename(filename) {
  const name = basename(filename, extname(filename));
  const cleaned = name.replace(/^\d+[-_]\s*/, '');

  if (cleaned.includes('--')) {
    const [titlePart, artistPart] = cleaned.split('--', 2);
    return {
      title: toTitleCase(titlePart.replace(/[-_]/g, ' ').trim()),
      artist: toTitleCase(artistPart.replace(/[-_]/g, ' ').trim()),
    };
  }

  return {
    title: toTitleCase(cleaned.replace(/[-_]/g, ' ').trim()),
    artist: 'Unknown',
  };
}

// ── R2 Upload ──

function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadToR2(r2, storagePath, fileBuffer) {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storagePath,
    Body: fileBuffer,
    ContentType: 'audio/mpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${R2_PUBLIC_URL}/${storagePath}`;
}

// ── Main ──

async function main() {
  if (!existsSync(MUSIC_DIR)) {
    console.error(`No scripts/music/ directory found.`);
    console.error(`Create it with vibe subfolders and add CC0/royalty-free MP3 files:`);
    console.error(`  mkdir -p scripts/music/{ideate,build,create,study,retro}`);
    console.error(`  # Add MP3 files named like: 01-track-title--artist-name.mp3`);
    process.exit(1);
  }

  const hasSubfolders = VIBE_CONFIG.some(v => {
    const dir = join(MUSIC_DIR, v.id);
    return existsSync(dir) && statSync(dir).isDirectory();
  });

  if (!hasSubfolders) {
    const flatFiles = readdirSync(MUSIC_DIR).filter(f => f.endsWith('.mp3'));
    if (flatFiles.length > 0) {
      console.error('Found MP3 files in scripts/music/ but no vibe subfolders.');
      console.error('Move tracks into subfolders: scripts/music/{ideate,build,create,study,retro}/');
      process.exit(1);
    }
    console.error('No vibe subfolders found in scripts/music/.');
    console.error('Create them: mkdir -p scripts/music/{ideate,build,create,study,retro}');
    process.exit(1);
  }

  // Calculate total size before uploading
  let totalBytes = 0;
  const vibeFiles = {};

  for (const vibe of VIBE_CONFIG) {
    const vibeDir = join(MUSIC_DIR, vibe.id);
    if (!existsSync(vibeDir)) {
      vibeFiles[vibe.id] = [];
      continue;
    }
    const files = readdirSync(vibeDir).filter(f => f.endsWith('.mp3')).sort();
    vibeFiles[vibe.id] = files;
    for (const file of files) {
      totalBytes += statSync(join(vibeDir, file)).size;
    }
  }

  const totalMB = totalBytes / (1024 * 1024);
  console.log(`Total size: ${totalMB.toFixed(1)}MB`);

  if (totalMB > MAX_TOTAL_SIZE_MB) {
    console.error(`Total size ${totalMB.toFixed(1)}MB exceeds ${MAX_TOTAL_SIZE_MB}MB limit.`);
    process.exit(1);
  }

  const totalTracks = Object.values(vibeFiles).reduce((sum, files) => sum + files.length, 0);
  if (totalTracks === 0) {
    console.error('No MP3 files found in any vibe subfolder.');
    process.exit(1);
  }

  console.log(`Found ${totalTracks} tracks across ${VIBE_CONFIG.length} vibes`);

  const r2 = createR2Client();
  console.log(`Uploading to Cloudflare R2 (${R2_BUCKET_NAME})`);

  const vibesData = [];

  for (const vibe of VIBE_CONFIG) {
    const files = vibeFiles[vibe.id];
    if (files.length === 0) {
      console.log(`\n[${vibe.name}] No tracks found, skipping`);
      continue;
    }

    console.log(`\n[${vibe.name}] Uploading ${files.length} tracks...`);
    const vibeTracks = [];

    for (const file of files) {
      const filePath = join(MUSIC_DIR, vibe.id, file);
      const fileBuffer = readFileSync(filePath);
      const { title, artist } = parseFilename(file);
      const storagePath = `${vibe.id}/${file}`;

      console.log(`  Uploading: ${storagePath} (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

      try {
        const publicUrl = await uploadToR2(r2, storagePath, fileBuffer);
        vibeTracks.push({
          id: `${vibe.id}-${file.replace('.mp3', '')}`,
          title,
          artist,
          src: publicUrl,
        });
      } catch (err) {
        console.error(`  Failed to upload ${storagePath}:`, err.message);
      }
    }

    if (vibeTracks.length > 0) {
      vibesData.push({
        id: vibe.id,
        name: vibe.name,
        description: vibe.description,
        icon: vibe.icon,
        tracks: vibeTracks,
      });
    }
  }

  if (vibesData.length === 0) {
    console.error('\nNo tracks were uploaded successfully.');
    process.exit(1);
  }

  // Generate tracks.js
  const totalUploaded = vibesData.reduce((sum, v) => sum + v.tracks.length, 0);
  const tracksContent = `/**
 * Track data for the Vibe Coding music player.
 * Auto-generated by scripts/setup-music.mjs
 *
 * ${vibesData.length} vibe modes, ${totalUploaded} tracks total.
 * Hosted on Cloudflare R2 (zero egress fees).
 * All tracks are CC0/royalty-free (no attribution required).
 */

export const vibes = ${JSON.stringify(vibesData, null, 2)};

// Backward compat: flat array of all tracks
export const tracks = vibes.flatMap(v => v.tracks);
export const TRACK_COUNT = tracks.length;
export const VIBE_COUNT = vibes.length;
`;

  writeFileSync(TRACKS_OUTPUT, tracksContent, 'utf-8');
  console.log(`\nGenerated ${TRACKS_OUTPUT}`);
  console.log(`  ${vibesData.length} vibes, ${totalUploaded} tracks total`);
  console.log(`  Total size: ${totalMB.toFixed(1)}MB`);
  console.log(`  Storage: Cloudflare R2`);
  console.log('Done! Run npm run dev to test the player.');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
