#!/usr/bin/env node

/**
 * Generate quiz data from lyrics JSON file
 *
 * This script takes a lyrics JSON file and creates a quiz version with:
 * - Lyrics with blanks (marked as _____)
 * - Array of blank positions and correct answers
 * - Difficulty level based on blank percentage
 *
 * Usage:
 * node scripts/generate-quiz.js <input-file.json> [output-file.json] [options]
 *
 * Options:
 * --difficulty easy|medium|hard (default: medium)
 * --blank-count <number> (override difficulty preset)
 * --strategy random|important|frequent (default: random)
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node scripts/generate-quiz.js <input-file.json> [output-file.json] [options]');
  console.error('\nOptions:');
  console.error('  --difficulty easy|medium|hard (default: medium)');
  console.error('  --blank-count <number> (override difficulty)');
  console.error('  --strategy random|important|frequent (default: random)');
  console.error('\nExamples:');
  console.error('  node scripts/generate-quiz.js src/data/amazing-grace.json');
  console.error('  node scripts/generate-quiz.js src/data/song.json --difficulty hard');
  console.error('  node scripts/generate-quiz.js src/data/song.json quiz.json --blank-count 10');
  process.exit(1);
}

const inputFile = args[0];

// Auto-generate output file path in quizzes directory if not specified
let defaultOutputFile = inputFile.replace('.json', '-quiz.json');
if (inputFile.includes('/lyrics/')) {
  defaultOutputFile = inputFile.replace('/lyrics/', '/quizzes/').replace('.json', '-quiz.json');
}

const outputFile = args[1] && !args[1].startsWith('--')
  ? args[1]
  : defaultOutputFile;

// Parse options
let difficulty = 'medium';
let blankCount = null;
let strategy = 'random';

for (let i = 0; i < args.length; i++) {
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

/**
 * Clean and tokenize lyrics into words
 */
function tokenizeLyrics(lyrics) {
  // Remove common formatting markers
  const cleanedLyrics = lyrics
    .replace(/\[.*?\]/g, '') // Remove [Verse 1], [Chorus], etc.
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();

  // Split into lines
  const lines = cleanedLyrics.split('\n').filter(line => line.trim().length > 0);

  return lines;
}

/**
 * Extract words from lyrics that can be blanked
 */
function extractWords(lyrics) {
  const words = [];
  const lines = lyrics.split('\n');

  lines.forEach((line, lineIndex) => {
    // Skip empty lines and section markers
    if (!line.trim() || line.match(/^\[.*\]$/)) {
      return;
    }

    // Match words (including hyphenated words)
    const wordMatches = [...line.matchAll(/\b[\w'-]+\b/g)];

    wordMatches.forEach((match) => {
      const word = match[0];
      const position = match.index;

      // Skip very short words (a, I, is, etc.) - they're too easy
      if (word.length <= 2) {
        return;
      }

      // Skip common words (optional - makes quiz harder)
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
      // Prefer longer words (likely more meaningful)
      selectedWords = [...words].sort((a, b) => b.length - a.length).slice(0, count);
      break;

    case 'frequent':
      // Track word frequency and blank common ones
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
      // Random selection
      selectedWords = [...words].sort(() => Math.random() - 0.5).slice(0, count);
      break;
  }

  // Sort by line order for easier processing
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

  // Group blanks by line
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

    // Sort blanks by position (descending) so we can replace from end to start
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
 * Main function
 */
async function main() {
  try {
    console.log(`\nGenerating quiz from: ${inputFile}`);
    console.log(`Difficulty: ${difficulty}`);
    console.log(`Strategy: ${strategy}\n`);

    // Read input file
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    const songData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    if (!songData.lyrics) {
      throw new Error('Input file must contain a "lyrics" field');
    }

    // Extract all possible words
    const allWords = extractWords(songData.lyrics);
    console.log(`Found ${allWords.length} potential words to blank`);

    // Determine blank count based on difficulty
    if (!blankCount) {
      const difficultyRatios = {
        easy: 0.10,    // 10% of words
        medium: 0.20,  // 20% of words
        hard: 0.35     // 35% of words
      };
      blankCount = Math.max(5, Math.floor(allWords.length * (difficultyRatios[difficulty] || 0.20)));
    }

    blankCount = Math.min(blankCount, allWords.length);
    console.log(`Creating ${blankCount} blanks`);

    // Select words to blank
    const selectedBlanks = selectBlanks(allWords, blankCount, strategy);

    // Generate quiz lyrics
    const quizLyrics = generateQuizLyrics(songData.lyrics, selectedBlanks);

    // Create quiz data structure
    const quizData = {
      id: songData.id,
      title: songData.title,
      artist: songData.artist,
      difficulty,
      lyrics: quizLyrics,
      blanks: selectedBlanks.map((blank, index) => ({
        id: index,
        answer: blank.word,
        lineIndex: blank.lineIndex,
        position: blank.position
      })),
      metadata: {
        originalFile: inputFile,
        generatedAt: new Date().toISOString(),
        strategy,
        totalBlanks: selectedBlanks.length,
        imageUrl: songData.imageUrl,
        thumbnailUrl: songData.thumbnailUrl,
        url: songData.url,
        releaseDate: songData.releaseDate
      }
    };

    // Write output file
    const outputPath = path.resolve(outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(quizData, null, 2), 'utf8');

    console.log(`\n✓ Quiz generated successfully!`);
    console.log(`  Song: ${songData.title} by ${songData.artist}`);
    console.log(`  Blanks: ${selectedBlanks.length}`);
    console.log(`  Strategy: ${strategy}`);
    console.log(`  Difficulty: ${difficulty}`);
    console.log(`  Saved to: ${outputPath}\n`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
