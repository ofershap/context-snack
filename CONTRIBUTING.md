# Contributing to Context Snack

Thanks for helping improve the extension. PRs that fix feed scrapers, improve card quality, or polish the wait experience are especially valuable.

## Development setup

```bash
git clone git@github.com:ofershap/context-snack.git
cd context-snack
npm install
npm run compile
```

**Extension Development Host:** open this folder in Cursor, then **Run Extension** from `.vscode/launch.json` (F5).

**Symlink install (dogfooding in your main window):**

```bash
npm run compile
ln -sf "$(pwd)" ~/.cursor/extensions/context-snack-1.1.0
```

Reload the Cursor window after code changes (`npm run compile` or `npm run watch`).

## Verifying feed and UI changes

Compile alone does not prove cards look correct. After changes to fetchers, cache, ordering, quality filters, or webview markup:

```bash
npm test
npm run judge-feed      # add --refresh after fetcher/cache changes
npm run judge-sources   # after fetcher/cache changes
npm run preview-feed
```

Open `.preview/feed-preview.png` and confirm cards are populated (not empty placeholders like `— / —`). See [AGENTS.md](AGENTS.md) for the maintainer checklist.

## Adding a feed source

1. Implement `src/feed/sources/<id>.ts` (fetch, normalize to shared card types, handle failures without throwing away the whole refresh).
2. Register the source in `src/feed/sources/registry.ts`.
3. Add a boolean under `contextSnack.sources` in `package.json` (`contributes.configuration`).
4. Run `judge-feed`, `judge-sources`, and `preview-feed` as above.
5. Document the source briefly in README settings if user-facing.

Expect scrapers to break when sites change HTML. Prefer graceful degradation (skip source, log, continue) over hard failures.

## Code style and PRs

- TypeScript in `src/`, tests in `test/`.
- Keep PRs focused: one logical change beats a mixed refactor + feature dump.
- Conventional commits (`fix:`, `feat:`) are optional but appreciated.
- CI runs compile and tests on push; ensure `npm test` passes locally.

## Product constraints (please respect)

- **Feed-first:** auto-show is the micro-learning feed, not games.
- **Games never auto-open;** only via command or explicit in-feed control.
- **Hooks:** never wipe `hooks.json` on parse errors; merge only.
- **Webview strings:** escape user- and feed-derived text; avoid breaking CSP or injecting raw HTML from RSS fields.

## Questions

Open a [GitHub issue](https://github.com/ofershap/context-snack/issues) or discuss in your PR. For security-sensitive reports, use [Security Advisories](https://github.com/ofershap/context-snack/security/advisories/new) instead of a public issue.
