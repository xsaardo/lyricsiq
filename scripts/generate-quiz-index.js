#!/usr/bin/env node

/**
 * Generate an index of all available quizzes
 * This script scans the quizzes directory and creates an index.json file
 * that the app can use to dynamically load all quizzes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUIZZES_DIR = path.resolve(__dirname, '../src/data/quizzes');
const OUTPUT_FILE = path.resolve(QUIZZES_DIR, 'index.json');

async function generateIndex() {
  try {
    console.log('\nGenerating quiz index...\n');

    // Check if quizzes directory exists
    if (!fs.existsSync(QUIZZES_DIR)) {
      console.error(`Quizzes directory not found: ${QUIZZES_DIR}`);
      process.exit(1);
    }

    // Read all files in the quizzes directory
    const files = fs.readdirSync(QUIZZES_DIR);
    const quizFiles = files.filter(file =>
      file.endsWith('.json') && file !== 'index.json'
    );

    console.log(`Found ${quizFiles.length} quiz files:`);

    const quizzes = [];

    // Load metadata from each quiz file
    for (const file of quizFiles) {
      const filePath = path.join(QUIZZES_DIR, file);

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const quiz = JSON.parse(content);

        // Extract relevant metadata
        const quizInfo = {
          id: quiz.id,
          title: quiz.title,
          artist: quiz.artist,
          difficulty: quiz.difficulty,
          blankCount: quiz.blanks?.length || 0,
          thumbnailUrl: quiz.metadata?.thumbnailUrl,
          imageUrl: quiz.metadata?.imageUrl,
          releaseDate: quiz.metadata?.releaseDate,
          path: `/src/data/quizzes/${file}`
        };

        quizzes.push(quizInfo);
        console.log(`  ✓ ${quiz.title} by ${quiz.artist} (${quiz.difficulty})`);
      } catch (err) {
        console.warn(`  ✗ Failed to parse ${file}: ${err.message}`);
      }
    }

    // Sort by artist, then title
    quizzes.sort((a, b) => {
      const artistCompare = a.artist.localeCompare(b.artist);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    });

    // Create index object
    const index = {
      generated: new Date().toISOString(),
      count: quizzes.length,
      quizzes
    };

    // Write index file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf8');

    console.log(`\n✓ Index generated successfully!`);
    console.log(`  Total quizzes: ${quizzes.length}`);
    console.log(`  Saved to: ${OUTPUT_FILE}\n`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

generateIndex();
