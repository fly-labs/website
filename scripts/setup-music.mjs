/**
 * Music Setup Script
 *
 * Uploads MP3 files from scripts/music/ to Supabase Storage (public bucket),
 * then auto-generates apps/web/src/lib/data/tracks.js with track metadata.
 *
 * Usage:
 *   1. Place CC0/royalty-free MP3s in scripts/music/
 *   2. Run: npm run setup:music
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from apps/web/.env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
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

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/web/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = 'music';
const MUSIC_DIR = join(__dirname, 'music');
const TRACKS_OUTPUT = join(__dirname, '..', 'apps', 'web', 'src', 'lib', 'data', 'tracks.js');

/**
 * Parse a filename like "01-chill-lofi-beats-artist-name.mp3" into title + artist
 * Convention: number-title-words--artist-words.mp3 (double dash separates artist)
 * Fallback: everything is the title, artist is "Unknown"
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
  // Remove leading track number (e.g., "01-" or "01_")
  const cleaned = name.replace(/^\d+[-_]\s*/, '');

  // Double dash separates title from artist
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

async function main() {
  // Check music directory exists
  if (!existsSync(MUSIC_DIR)) {
    console.error(`No scripts/music/ directory found.`);
    console.error(`Create it and add CC0/royalty-free MP3 files:`);
    console.error(`  mkdir -p scripts/music`);
    console.error(`  # Add MP3 files named like: 01-track-title--artist-name.mp3`);
    process.exit(1);
  }

  const files = readdirSync(MUSIC_DIR)
    .filter(f => f.endsWith('.mp3'))
    .sort();

  if (files.length === 0) {
    console.error('No MP3 files found in scripts/music/');
    process.exit(1);
  }

  console.log(`Found ${files.length} tracks in scripts/music/`);

  // Create bucket (ignore error if exists)
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20MB per file
    allowedMimeTypes: ['audio/mpeg', 'audio/mp3'],
  });
  if (bucketError && !bucketError.message?.includes('already exists')) {
    console.error('Failed to create bucket:', bucketError.message);
    process.exit(1);
  }
  console.log(`Bucket "${BUCKET}" ready`);

  const tracks = [];

  for (const file of files) {
    const filePath = join(MUSIC_DIR, file);
    const fileBuffer = readFileSync(filePath);
    const { title, artist } = parseFilename(file);

    console.log(`  Uploading: ${file} (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

    // Upload (upsert to handle re-runs)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(file, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`  Failed to upload ${file}:`, uploadError.message);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(file);
    const publicUrl = urlData.publicUrl;

    tracks.push({
      id: file.replace('.mp3', ''),
      title,
      artist,
      src: publicUrl,
    });
  }

  if (tracks.length === 0) {
    console.error('No tracks were uploaded successfully.');
    process.exit(1);
  }

  // Generate tracks.js
  const tracksContent = `/**
 * Track data for the Vibe Coding music player.
 * Auto-generated by scripts/setup-music.mjs
 * ${tracks.length} tracks from Supabase Storage (public bucket)
 */

export const tracks = ${JSON.stringify(tracks, null, 2)};

export const TRACK_COUNT = tracks.length;
`;

  writeFileSync(TRACKS_OUTPUT, tracksContent, 'utf-8');
  console.log(`\nGenerated ${TRACKS_OUTPUT} with ${tracks.length} tracks`);
  console.log('Done! Run npm run dev to test the player.');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
