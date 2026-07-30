# Context Snack — agent context (product + engineering)

Short reference for AI agents working in this repo. Human-facing docs: README, SECURITY, CONTRIBUTING.

## Product (locked)

- **Tagline:** Micro-learnings while your agent works - because developers never have enough context switches.
- **Wedge:** Agent is thinking → user gets a Context Snack (feed), not a forced mini-game.
- **Feed-first.** Games (Snake, Pong, Invaders) are optional; **games NEVER auto-open.** Mood reactions were removed.
- Free, MIT, publisher `ofershap` (same Open VSX namespace as Cursor Office), repo https://github.com/ofershap/context-snack
- Settings prefix: `contextSnack.*`, package name `context-snack`

## Architecture

1. **Hooks:** On activate, merge into `~/.cursor/hooks.json` (never wipe on parse failure). Install `~/.cursor/hooks/context-snack-agent-state.mjs` from extension bundle.
2. **Hook script:** Cursor events `beforeSubmitPrompt`, `stop`, `sessionEnd` update `~/.cursor/context-snack/busy.json` (active conversations, timestamps, workspace roots).
3. **AgentStateWatcher:** FS watch + poll on `busy.json`. **Workspace gating:** only treat busy if conversation roots overlap current workspace folders. **showDelayMs** before calling show. **Mute store** per conversation id.
4. **Feed:** Background refresh → cache under `~/.cursor/context-snack/`. Webview shows shuffled cards; **seen** tracking avoids immediate repeats. **Quality bar** in `quality.ts` (min summary length, reject URL-only / teaser junk).
5. **Soft-close:** When agent goes idle, feed uses countdown UI (`closeCountdownUi`) instead of hard instant hide.
6. **Side features:** Games are a separate webview, gated by `enableGames`.

## Feed sources

Registry in `src/feed/sources/registry.ts`. IDs: cursor, tldr, hn, devto, github, producthunt, geeky (Lobsters / Show HN style). Each source can fail independently. **Scrapers break often;** maintain best-effort, graceful skip.

## Verification after UI/feed edits

Do not claim success from compile only. Run: `npm test`, `judge-feed` (`--refresh` if fetch/cache changed), `judge-sources`, `preview-feed`; inspect `.preview/feed-preview.png`.

## Landmines

| Topic | Risk | Mitigation |
| --- | --- | --- |
| **Webview quotes / HTML** | XSS or broken layout from RSS titles | Escape in card render; no raw feed HTML in DOM |
| **hooks.json** | Wiping user hooks | Parse fail → skip merge; only append/migrate Context Snack entries |
| **Cross-window busy** | Feed pops in wrong project | Match `workspaceRoots` on conversation entries |
| **Star activation** | vsce reject | Package with `--allow-star-activation` |
| **Legacy hook name** | `pending-games-agent-state.mjs` | Migrate to `context-snack-agent-state.mjs` on install |

## Commands (palette)

`showFeed`, `hideGame`, `muteCurrentChat`, `showGame`, `showStats` — all under category Context Snack.

## Docs map

- README: user story, install, settings, architecture sketch
- SECURITY.md: disk, network, uninstall hooks
- CONTRIBUTING.md: dev loop, new source checklist
- docs/MARKETPLACE.md: Open VSX publish plan (not claiming live listing)
- AGENTS.md: maintainer feed preview loop

## Out of scope for agents unless asked

- npm library publishing (extension only)
- Auto-opening games on agent busy
- Factory-wide cross-promo in README
