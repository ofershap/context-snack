#!/usr/bin/env node
const path = require('path');

const root = path.join(__dirname, '..');
const { fetchCardsBySource } = require(path.join(root, 'out', 'feed', 'fetch.js'));
const {
  judgeFeedCard,
  MIN_SNACK_SUMMARY_LENGTH,
  isUrlOnlySummary,
  isTruncatedTeaser
} = require(path.join(root, 'out', 'feed', 'quality.js'));

const REQUIRED = ['cursor', 'tldr', 'devto', 'hn', 'github'];
const MIN_KEPT = { cursor: 2, tldr: 2, devto: 2, hn: 2, github: 2, geeky: 1 };

function median(nums) {
  if (nums.length === 0) {
    return 0;
  }
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  const results = await fetchCardsBySource();
  const bad = [];
  let failed = false;

  for (const result of results) {
    const { sourceKey, label, ok, error, rawCount, cards } = result;

    if (!ok) {
      console.log(`${label}: FAILED — ${error}`);
      if (REQUIRED.includes(sourceKey)) {
        failed = true;
      }
      continue;
    }

    const lengths = cards.map(c => (c.summary || '').length);
    const med = median(lengths);
    const withImage = cards.filter(c => c.image).length;
    const imageRatio = cards.length ? `${withImage}/${cards.length}` : '0/0';

    const shortest = [...cards]
      .sort((a, b) => (a.summary || '').length - (b.summary || '').length)
      .slice(0, 3)
      .map(c => `[${(c.summary || '').length}] ${(c.summary || '').slice(0, 80)}`);

    console.log(`${label}: raw=${rawCount} kept=${cards.length} medianLen=${Math.round(med)} images=${imageRatio}`);
    if (shortest.length) {
      console.log('  shortest:');
      for (const s of shortest) {
        console.log(`    ${s}`);
      }
    }

    const minKept = MIN_KEPT[sourceKey] ?? 2;
    if (REQUIRED.includes(sourceKey) && cards.length < minKept) {
      console.error(`  FAIL: kept ${cards.length} < ${minKept}`);
      failed = true;
    }

    if (sourceKey === 'geeky' && cards.length === 0) {
      console.warn('  WARN: geeky source returned 0 kept cards');
    }

    const thinHardFail = new Set(['Dev.to', 'TLDR AI', 'Hacker News']);

    for (const card of cards) {
      const issues = judgeFeedCard(card);

      if (card.summary && isUrlOnlySummary(card.summary)) {
        issues.push('url-only summary slipped through');
      }
      if (card.summary && isTruncatedTeaser(card.summary)) {
        issues.push('truncated teaser slipped through');
      }
      if (
        thinHardFail.has(label) &&
        card.summary &&
        card.summary.length < MIN_SNACK_SUMMARY_LENGTH
      ) {
        issues.push(`thin summary (${card.summary.length}<${MIN_SNACK_SUMMARY_LENGTH})`);
      }

      if (issues.length) {
        bad.push({ source: label, card, issues });
      }
    }
  }

  if (bad.length) {
    console.log('\nBad cards:');
    for (const { source, card, issues } of bad.slice(0, 20)) {
      console.log(`  [${source}] ${card.title}`);
      console.log(`    → ${issues.join('; ')}`);
    }
    failed = true;
  }

  if (failed) {
    console.error('\nSOURCES JUDGE FAIL');
    process.exit(1);
  }
  console.log('\nSOURCES JUDGE OK');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
