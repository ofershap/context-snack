# Context Snack

Cursor IDE extension. Package: `context-snack`. Publisher: `ofershap`.

## Local debug

Open **this folder alone** in a Cursor window (File → New Window → Open Folder). Do not rely on the factory monorepo root.

1. `npm install && npm run compile`
2. Press **F5** (Run Extension) → Extension Development Host
3. Or symlink: `ln -sfn "$(pwd)" ~/.cursor/extensions/context-snack-1.2.4` then Reload Window

## After UI / feed changes

1. `npm run compile`
2. `node scripts/judge-feed.cjs` (`--refresh` if fetcher/cache changed)
3. `node scripts/judge-sources.cjs` (after fetcher/cache changes)
4. `node scripts/preview-feed.cjs`
5. Read `.preview/feed-preview.png` - real titles/summaries, not empty, not `— / —`

Do not claim UI works from compile alone. See `CONTEXT.md` and `.cursor/rules/`.
