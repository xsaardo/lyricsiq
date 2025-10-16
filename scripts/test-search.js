#!/usr/bin/env node

/**
 * Test script to debug Genius API search
 */

import { searchSong } from '../src/utils/genius.js';

const accessToken = process.env.GENIUS_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Error: GENIUS_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

const artist = process.argv[2] || "Aretha Franklin";
const songTitle = process.argv[3] || "Amazing Grace";

console.log(`Searching for: "${songTitle}" by ${artist}`);
console.log('---');

try {
  const results = await searchSong(artist, songTitle, accessToken);

  console.log(`Found ${results.length} results:\n`);

  results.slice(0, 5).forEach((song, index) => {
    console.log(`${index + 1}. "${song.title}" by ${song.primary_artist.name}`);
    console.log(`   ID: ${song.id}`);
    console.log(`   URL: ${song.url}`);
    console.log(`   Image: ${song.song_art_image_thumbnail_url}`);
    console.log('');
  });

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
