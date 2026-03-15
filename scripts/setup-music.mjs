/**
 * Music Setup Script
 *
 * Uploads MP3 files from scripts/music/{vibe}/ subfolders to Supabase Storage
 * (public bucket), then auto-generates apps/web/src/lib/data/tracks.js with
 * vibe-based track metadata.
 *
 * Usage:
 *   1. Place CC0/royalty-free MP3s in scripts/music/{ideate,build,create,study}/
 *   2. Run: npm run setup:music
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from apps/web/.env
 */

import { createClient } from '@supabase/supabase-js';
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

const VIBE_CONFIG = [
  { id: 'ideate', name: 'Ideate', description: 'Brainstorm mode. Upbeat beats to spark ideas.', icon: 'Lightbulb' },
  { id: 'build', name: 'Build', description: 'Flow state. Driving rhythms for deep work.', icon: 'Hammer' },
  { id: 'create', name: 'Create', description: 'Cozy vibes. Warm beats for writing and creating.', icon: 'PenLine' },
  { id: 'study', name: 'Study', description: 'Focus mode. Calm sounds for reading and learning.', icon: 'BookOpen' },
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
    console.error(`Create it with vibe subfolders and add CC0/royalty-free MP3 files:`);
    console.error(`  mkdir -p scripts/music/{ideate,build,create,study}`);
    console.error(`  # Add MP3 files named like: 01-track-title--artist-name.mp3`);
    process.exit(1);
  }

  // Detect mode: subfolder-based (new) or flat (legacy)
  const hasSubfolders = VIBE_CONFIG.some(v => {
    const dir = join(MUSIC_DIR, v.id);
    return existsSync(dir) && statSync(dir).isDirectory();
  });

  if (!hasSubfolders) {
    // Legacy flat mode: check for MP3s directly in music/
    const flatFiles = readdirSync(MUSIC_DIR).filter(f => f.endsWith('.mp3'));
    if (flatFiles.length > 0) {
      console.error('Found MP3 files in scripts/music/ but no vibe subfolders.');
      console.error('Move tracks into subfolders: scripts/music/{ideate,build,create,study}/');
      console.error('Example: mv scripts/music/01-track.mp3 scripts/music/build/01-track.mp3');
      process.exit(1);
    }
    console.error('No vibe subfolders found in scripts/music/.');
    console.error('Create them: mkdir -p scripts/music/{ideate,build,create,study}');
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

  // Clean up old flat-structure files (files at root, not in subfolders)
  console.log('\nCleaning up old flat-structure files...');
  const { data: existingFiles } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (existingFiles) {
    const rootFiles = existingFiles.filter(f => f.name?.endsWith('.mp3'));
    if (rootFiles.length > 0) {
      const filesToDelete = rootFiles.map(f => f.name);
      const { error: deleteError } = await supabase.storage.from(BUCKET).remove(filesToDelete);
      if (deleteError) {
        console.warn(`  Warning: could not delete old files: ${deleteError.message}`);
      } else {
        console.log(`  Removed ${filesToDelete.length} old flat-structure files`);
      }
    } else {
      console.log('  No old files to clean up');
    }
  }

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

      // Upload (upsert to handle re-runs)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error(`  Failed to upload ${storagePath}:`, uploadError.message);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      vibeTracks.push({
        id: `${vibe.id}-${file.replace('.mp3', '')}`,
        title,
        artist,
        src: publicUrl,
      });
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
  console.log('Done! Run npm run dev to test the player.');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
