#!/usr/bin/env node

/**
 * All-in-one script to fetch lyrics and generate a quiz
 *
 * Usage:
 * node scripts/create-quiz.js "Artist Name" "Song Title" [options]
 *
 * Options:
 * --difficulty easy|medium|hard (default: medium)
 * --strategy random|important|frequent (default: random)
 * --blank-count <number> (override difficulty)
 *
 * Requires GENIUS_ACCESS_TOKEN environment variable
 *
 * Examples:
 * node scripts/create-quiz.js "Aretha Franklin" "Amazing Grace"
 * node scripts/create-quiz.js "Artist" "Song" --difficulty hard --strategy important
 */

import { fetchLyrics } from '../src/utils/lyrics-fetcher.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/create-quiz.js "Artist Name" "Song Title" [options]');
  console.error('\nOptions:');
  console.error('  --difficulty easy|medium|hard (default: medium)');
  console.error('  --strategy random|important|frequent (default: random)');
  console.error('  --blank-count <number> (override difficulty)');
  console.error('\nExamples:');
  console.error('  node scripts/create-quiz.js "Aretha Franklin" "Amazing Grace"');
  console.error('  node scripts/create-quiz.js "Artist" "Song" --difficulty hard');
  console.error('\nRequires GENIUS_ACCESS_TOKEN environment variable');
  process.exit(1);
}

const artist = args[0];
const songTitle = args[1];

// Parse options
let difficulty = 'medium';
let blankCount = null;
let strategy = 'random';

for (let i = 2; i < args.length; i++) {
  if (args[i] === '--difficulty' && args[i + 1]) {
    difficulty = args[i + 1];
  }
  if (args[i] === '--blank-count' && args[i + 1]) {
    blankCount = parseInt(args[i + 1]);
  }
  if (args[i] === '--strategy' && args[i + 1]) {
    strategy = args[i + 1];
  }
}

// Get access token
const accessToken = process.env.GENIUS_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Error: GENIUS_ACCESS_TOKEN environment variable is required');
  console.error('Get your token from: https://genius.com/api-clients');
  console.error('\nSet it with: export GENIUS_ACCESS_TOKEN="your-token-here"');
  process.exit(1);
}

/**
 * Extract words from lyrics that can be blanked
 */
function extractWords(lyrics) {
  const words = [];
  const lines = lyrics.split('\n');

  lines.forEach((line, lineIndex) => {
    if (!line.trim() || line.match(/^\[.*\]$/)) {
      return;
    }

    const wordMatches = [...line.matchAll(/\b[\w'-]+\b/g)];

    wordMatches.forEach((match) => {
      const word = match[0];
      const position = match.index;

      if (word.length <= 2) {
        return;
      }

      const commonWords = ['the', 'and', 'but', 'for', 'with', 'from', 'that', 'this', 'have', 'has', 'was', 'were'];
      if (commonWords.includes(word.toLowerCase())) {
        return;
      }

      words.push({
        word,
        lineIndex,
        position,
        length: word.length
      });
    });
  });

  return words;
}

/**
 * Select words to blank based on strategy
 */
function selectBlanks(words, count, strategy) {
  if (words.length === 0) return [];

  let selectedWords;

  switch (strategy) {
    case 'important':
      selectedWords = [...words].sort((a, b) => b.length - a.length).slice(0, count);
      break;

    case 'frequent':
      const frequency = {};
      words.forEach(w => {
        const lower = w.word.toLowerCase();
        frequency[lower] = (frequency[lower] || 0) + 1;
      });
      selectedWords = [...words]
        .sort((a, b) => frequency[b.word.toLowerCase()] - frequency[a.word.toLowerCase()])
        .slice(0, count);
      break;

    case 'random':
    default:
      selectedWords = [...words].sort(() => Math.random() - 0.5).slice(0, count);
      break;
  }

  return selectedWords.sort((a, b) => {
    if (a.lineIndex !== b.lineIndex) return a.lineIndex - b.lineIndex;
    return a.position - b.position;
  });
}

/**
 * Generate quiz lyrics with blanks
 */
function generateQuizLyrics(lyrics, blanks) {
  const lines = lyrics.split('\n');
  const blanksMap = {};

  blanks.forEach((blank, index) => {
    if (!blanksMap[blank.lineIndex]) {
      blanksMap[blank.lineIndex] = [];
    }
    blanksMap[blank.lineIndex].push({ ...blank, blankId: index });
  });

  const quizLines = lines.map((line, lineIndex) => {
    if (!blanksMap[lineIndex]) {
      return line;
    }

    const lineBlanks = blanksMap[lineIndex].sort((a, b) => b.position - a.position);

    let modifiedLine = line;
    lineBlanks.forEach((blank) => {
      const before = modifiedLine.substring(0, blank.position);
      const after = modifiedLine.substring(blank.position + blank.word.length);
      modifiedLine = before + `_____${blank.blankId}_____` + after;
    });

    return modifiedLine;
  });

  return quizLines.join('\n');
}

/**
 * Prompt user for confirmation
 */
function promptUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Search for song and let user confirm
 */
async function searchAndConfirm(artist, songTitle, accessToken) {
  // Import searchSong function
  const { searchSong } = await import('../src/utils/genius.js');

  console.log(`Searching for "${songTitle}" by ${artist}...`);
  const results = await searchSong(artist, songTitle, accessToken);

  if (!results || results.length === 0) {
    throw new Error(`No results found for "${songTitle}" by ${artist}"`);
  }

  console.log(`\nFound ${results.length} results:\n`);

  // Show top 5 results
  const topResults = results.slice(0, 5);
  topResults.forEach((song, index) => {
    console.log(`${index + 1}. "${song.title}" by ${song.primary_artist.name}`);
    console.log(`   Album art: ${song.song_art_image_thumbnail_url}`);
    console.log(`   URL: ${song.url}`);
    if (song.release_date_for_display) {
      console.log(`   Released: ${song.release_date_for_display}`);
    }
    console.log('');
  });

  const answer = await promptUser(`Select a song (1-${topResults.length}) or press Enter for #1: `);
  const selection = answer.trim() === '' ? 1 : parseInt(answer);

  if (isNaN(selection) || selection < 1 || selection > topResults.length) {
    throw new Error('Invalid selection');
  }

  return topResults[selection - 1];
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('\n=== LyricsIQ Quiz Creator ===\n');

    // Step 1: Search and confirm song selection
    const selectedSong = await searchAndConfirm(artist, songTitle, accessToken);

    console.log(`\n✓ Selected: "${selectedSong.title}" by ${selectedSong.primary_artist.name}\n`);

    // Import fetchPageHTML and other functions
    const { fetchPageHTML, extractLyricsFromHTML, cleanLyricsHTML } = await import('../src/utils/genius.js');

    console.log('Fetching lyrics...');

    // Step 2: Fetch the lyrics page
    const htmlContent = await fetchPageHTML(selectedSong.url);
    const extracted = extractLyricsFromHTML(htmlContent);
    const cleanedLyrics = cleanLyricsHTML(extracted.rawHTML);

    console.log(`✓ Lyrics fetched (${cleanedLyrics.length} characters)`);

    // Generate file paths
    const lyricsFileName = `${songTitle.toLowerCase().replace(/\s+/g, '-')}`;
    const lyricsPath = path.resolve(`src/data/lyrics/${lyricsFileName}.json`);
    const quizPath = path.resolve(`src/data/quizzes/${lyricsFileName}-quiz.json`);

    // Step 3: Save raw lyrics
    const songData = {
      id: selectedSong.id,
      title: selectedSong.title,
      artist: selectedSong.primary_artist.name,
      lyrics: cleanedLyrics,
      url: selectedSong.url,
      imageUrl: selectedSong.song_art_image_url,
      thumbnailUrl: selectedSong.song_art_image_thumbnail_url,
      releaseDate: selectedSong.release_date_for_display,
      fetchedAt: new Date().toISOString(),
      note: "For educational/personal use only. Ensure you have proper rights to use this content."
    };

    // Create directories if they don't exist
    fs.mkdirSync(path.dirname(lyricsPath), { recursive: true });
    fs.mkdirSync(path.dirname(quizPath), { recursive: true });

    fs.writeFileSync(lyricsPath, JSON.stringify(songData, null, 2), 'utf8');
    console.log(`✓ Lyrics saved to: ${lyricsPath}`);

    // Step 4: Generate quiz
    console.log(`\nGenerating quiz (${difficulty}, ${strategy} strategy)...`);

    const allWords = extractWords(cleanedLyrics);
    console.log(`  Found ${allWords.length} potential words to blank`);

    if (!blankCount) {
      const difficultyRatios = {
        easy: 0.10,
        medium: 0.20,
        hard: 0.35
      };
      blankCount = Math.max(5, Math.floor(allWords.length * (difficultyRatios[difficulty] || 0.20)));
    }

    blankCount = Math.min(blankCount, allWords.length);
    console.log(`  Creating ${blankCount} blanks`);

    const selectedBlanks = selectBlanks(allWords, blankCount, strategy);
    const quizLyrics = generateQuizLyrics(cleanedLyrics, selectedBlanks);

    // Step 5: Save quiz
    const quizData = {
      id: selectedSong.id,
      title: selectedSong.title,
      artist: selectedSong.primary_artist.name,
      difficulty,
      lyrics: quizLyrics,
      blanks: selectedBlanks.map((blank, index) => ({
        id: index,
        answer: blank.word,
        lineIndex: blank.lineIndex,
        position: blank.position
      })),
      metadata: {
        originalFile: lyricsPath,
        generatedAt: new Date().toISOString(),
        strategy,
        totalBlanks: selectedBlanks.length,
        imageUrl: selectedSong.song_art_image_url,
        thumbnailUrl: selectedSong.song_art_image_thumbnail_url,
        url: selectedSong.url,
        releaseDate: selectedSong.release_date_for_display
      }
    };

    fs.writeFileSync(quizPath, JSON.stringify(quizData, null, 2), 'utf8');

    console.log(`\n✓ Quiz created successfully!\n`);
    console.log(`Song: ${selectedSong.title} by ${selectedSong.primary_artist.name}`);
    console.log(`Difficulty: ${difficulty}`);
    console.log(`Blanks: ${selectedBlanks.length}`);
    console.log(`Strategy: ${strategy}`);
    console.log(`\nFiles created:`);
    console.log(`  Lyrics: ${lyricsPath}`);
    console.log(`  Quiz:   ${quizPath}`);
    console.log(`\n⚠️  Remember: Only use this content if you have proper rights or it's in the public domain.\n`);

    // Regenerate quiz index
    console.log('Regenerating quiz index...');
    const { execSync } = await import('child_process');
    try {
      execSync('node scripts/generate-quiz-index.js', { stdio: 'inherit' });
    } catch (err) {
      console.warn('Warning: Failed to regenerate index. Run: npm run index');
    }

    console.log(`\nNext steps:`);
    console.log(`  1. Refresh your browser or restart dev server`);
    console.log(`  2. The new quiz should appear automatically!\n`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
