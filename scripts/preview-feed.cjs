#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const outDir = path.join(root, '.preview');
const htmlPath = path.join(outDir, 'feed-preview.html');
const shotPath = path.join(outDir, 'feed-preview.png');
const pyPath = path.join(root, 'scripts', 'shot-feed.py');

function loadCards() {
  const cachePath = path.join(os.homedir(), '.cursor', 'context-snack', 'feed-cache.json');
  if (!fs.existsSync(cachePath)) {
    throw new Error(`No feed cache at ${cachePath}. Run: node scripts/judge-feed.cjs --refresh`);
  }
  const cards = JSON.parse(fs.readFileSync(cachePath, 'utf-8')).cards || [];
  if (cards.length === 0) {
    throw new Error('Feed cache has 0 cards');
  }
  return cards;
}

function assertScriptParses(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (scripts.length === 0) {
    throw new Error('No script tags in feed HTML');
  }
  for (const [i, source] of scripts.entries()) {
    try {
      // eslint-disable-next-line no-new-func
      new Function(source);
    } catch (error) {
      throw new Error(`Webview script ${i} has syntax error: ${error.message}`);
    }
  }
}

function buildPreviewHtml(cards) {
  const { buildFeedWebviewHtml } = require(path.join(root, 'out', 'feed', 'webview', 'html.js'));
  let html = buildFeedWebviewHtml();
  assertScriptParses(html);

  const bridge = [
    '<script>',
    `window.__PREVIEW_CARDS__ = ${JSON.stringify(cards.slice(0, 12))};`,
    'window.acquireVsCodeApi = function () { return { postMessage: function () {} }; };',
    '</script>'
  ].join('\n');
  return html.replace('<head>', `<head>${bridge}`);
}

function main() {
  const cards = loadCards();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(htmlPath, buildPreviewHtml(cards), 'utf-8');

  const result = spawnSync('python3', [pyPath], { encoding: 'utf-8', cwd: outDir });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  console.log(`Screenshot: ${shotPath}`);
  console.log(`Cards injected: ${Math.min(12, cards.length)} of ${cards.length}`);
}

main();
