#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.join(__dirname, '..');
const refresh = process.argv.includes('--refresh');
const { judgeFeedCard } = require(path.join(root, 'out', 'feed', 'quality.js'));

async function main() {
  let cards;
  if (refresh) {
    const { fetchAllCards } = require(path.join(root, 'out', 'feed', 'fetch.js'));
    cards = await fetchAllCards();
    const cachePath = path.join(os.homedir(), '.cursor', 'context-snack', 'feed-cache.json');
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify({ cards, updatedAt: Date.now() }, null, 2));
    console.log(`Refreshed cache → ${cards.length} cards\n`);
  } else {
    const cachePath = path.join(os.homedir(), '.cursor', 'context-snack', 'feed-cache.json');
    cards = JSON.parse(fs.readFileSync(cachePath, 'utf-8')).cards || [];
    console.log(`Loaded cache → ${cards.length} cards\n`);
  }

  const bySource = {};
  const bad = [];
  let withImage = 0;

  for (const card of cards) {
    bySource[card.source] = (bySource[card.source] || 0) + 1;
    if (card.image) withImage++;
    const issues = judgeFeedCard(card);
    if (issues.length) bad.push({ card, issues });
  }

  console.log('By source:');
  for (const [source, count] of Object.entries(bySource)) {
    console.log(`  ${source}: ${count}`);
  }
  console.log(`\nWith images: ${withImage}/${cards.length}`);
  console.log(`Weak/bad cards: ${bad.length}`);

  if (bad.length) {
    console.log('\nProblems:');
    for (const { card, issues } of bad.slice(0, 15)) {
      console.log(`  [${card.source}] ${card.title}`);
      console.log(`    → ${issues.join('; ')}`);
      console.log(`    summary: ${(card.summary || '').slice(0, 100)}`);
    }
  }

  console.log('\nSample deck (first 8):');
  for (const card of cards.slice(0, 8)) {
    console.log(`\n• [${card.source}] ${card.title}`);
    console.log(`  ${(card.summary || '').slice(0, 160)}`);
    if (card.image) console.log(`  img: ${card.image.slice(0, 70)}…`);
  }

  const fail = cards.length === 0 || bad.length > cards.length * 0.35;
  if (fail) {
    console.error('\nJUDGE FAIL');
    process.exit(1);
  }
  console.log('\nJUDGE OK');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
