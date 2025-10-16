#!/usr/bin/env node

/**
 * CLI tool to fetch lyrics and save to JSON
 *
 * IMPORTANT: This tool is for educational and personal use only.
 * Only use with:
 * - Public domain songs (pre-1928)
 * - Songs you have permission to use
 * - Educational fair use purposes
 *
 * Usage:
 * node scripts/fetch-lyrics-cli.js "Artist Name" "Song Title" [output-file.json]
 *
 * Requires GENIUS_ACCESS_TOKEN environment variable
 */

import { fetchLyrics } from '../src/utils/lyrics-fetcher.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/fetch-lyrics-cli.js "Artist Name" "Song Title" [output-file.json]');
  console.error('Example: node scripts/fetch-lyrics-cli.js "Traditional" "Amazing Grace" amazing-grace.json');
  console.error('\nRequires GENIUS_ACCESS_TOKEN environment variable');
  process.exit(1);
}

const artist = args[0];
const songTitle = args[1];
const outputFile = args[2] || `src/data/lyrics/${songTitle.toLowerCase().replace(/\s+/g, '-')}.json`;

// Get access token from environment
const accessToken = process.env.GENIUS_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Error: GENIUS_ACCESS_TOKEN environment variable is required');
  console.error('Get your token from: https://genius.com/api-clients');
  console.error('\nSet it with: export GENIUS_ACCESS_TOKEN="your-token-here"');
  process.exit(1);
}

async function main() {
  try {
    console.log(`\nFetching lyrics for "${songTitle}" by ${artist}...`);

    const result = await fetchLyrics(artist, songTitle, accessToken, {
      returnSongInfo: true
    });

    // Create the output directory if it doesn't exist
    const outputDir = path.dirname(outputFile);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Format the data for our quiz app
    const songData = {
      id: result.songInfo.id,
      title: result.songInfo.title,
      artist: result.songInfo.artist,
      lyrics: result.lyrics,
      url: result.songInfo.url,
      imageUrl: result.songInfo.imageUrl,
      thumbnailUrl: result.songInfo.thumbnailUrl,
      releaseDate: result.songInfo.releaseDate,
      fetchedAt: new Date().toISOString(),
      note: "For educational/personal use only. Ensure you have proper rights to use this content."
    };

    // Write to file
    const outputPath = path.resolve(outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(songData, null, 2), 'utf8');

    console.log(`\n✓ Success!`);
    console.log(`  Song: ${result.songInfo.title}`);
    console.log(`  Artist: ${result.songInfo.artist}`);
    console.log(`  Lyrics length: ${result.lyrics.length} characters`);
    console.log(`  Saved to: ${outputPath}`);
    console.log(`\n⚠️  Remember: Only use this content if you have proper rights or it's in the public domain.`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
