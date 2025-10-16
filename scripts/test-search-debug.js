#!/usr/bin/env node

/**
 * Debug script to see raw Genius API response
 */

import https from 'https';

const accessToken = process.env.GENIUS_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Error: GENIUS_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

const artist = process.argv[2] || "Aretha Franklin";
const songTitle = process.argv[3] || "Amazing Grace";

const searchQuery = `${songTitle} ${artist}`;
const query = encodeURIComponent(searchQuery);

console.log(`Search query: "${searchQuery}"`);
console.log(`Encoded: ${query}`);
console.log(`API URL: https://api.genius.com/search?q=${query}`);
console.log('---\n');

const options = {
  hostname: 'api.genius.com',
  path: `/search?q=${query}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'User-Agent': 'Lyrics Fetcher and Cleaner'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Full API Response:');
      console.log(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
