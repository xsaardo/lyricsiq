# Data Directory Structure

This directory contains the song lyrics and quiz data for LyricsIQ.

## Structure

```
/data
├── /lyrics     # Raw lyrics files fetched from Genius API
├── /quizzes    # Generated quiz files with blanks
└── README.md   # This file
```

## Workflow

### 1. Fetch Lyrics
Use the lyrics fetcher CLI to download song lyrics:

```bash
export GENIUS_ACCESS_TOKEN="your-token"
node scripts/fetch-lyrics-cli.js "Artist Name" "Song Title"
```

This will create a file in `src/data/lyrics/song-title.json` with:
- Song metadata (id, title, artist, etc.)
- Full lyrics text
- Album art URLs

### 2. Generate Quiz
Use the quiz generator to create a quiz from the lyrics:

```bash
node scripts/generate-quiz.js src/data/lyrics/song-title.json --difficulty medium
```

This will create a file in `src/data/quizzes/song-title-quiz.json` with:
- Lyrics with blanks marked as `_____0_____`, `_____1_____`, etc.
- Array of correct answers for each blank
- Difficulty level and metadata

### 3. Add to App
To make the quiz available in the app, add the quiz file path to:
- `src/components/SongSelector.jsx` (line ~18)
- `src/App.jsx` (line ~35)

## Quiz Difficulty Levels

- **Easy**: 10% of words blanked out
- **Medium**: 20% of words blanked out
- **Hard**: 35% of words blanked out

## Blank Selection Strategies

- **Random**: Random word selection (default)
- **Important**: Prefer longer, more meaningful words
- **Frequent**: Target commonly repeated words

## Example Commands

```bash
# Fetch lyrics
node scripts/fetch-lyrics-cli.js "Aretha Franklin" "Amazing Grace"

# Generate easy quiz
node scripts/generate-quiz.js src/data/lyrics/amazing-grace.json --difficulty easy

# Generate hard quiz with specific strategy
node scripts/generate-quiz.js src/data/lyrics/song.json --difficulty hard --strategy important

# Custom blank count
node scripts/generate-quiz.js src/data/lyrics/song.json --blank-count 20
```

## Legal Notice

**IMPORTANT**: Only use lyrics content that you have the legal right to use:
- Public domain songs (pre-1928)
- Songs you have permission to use
- Educational/fair use purposes only

Copyrighted lyrics should not be used in production without proper licensing.
