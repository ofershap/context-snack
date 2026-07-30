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
3. **AgentStateWatcher:** FS watch + poll on `busy.json`. **Workspace gating:** only treat busy if conversation roots overlap current workspace folders. **showDelayMs** before calling show. **Mute store** per conversation id - must persist across idle/busy cycles for that chat (do not prune mutes when `busy.json` clears).
4. **Feed:** Background refresh → cache under `~/.cursor/context-snack/`. Webview shows shuffled cards; **seen** tracking avoids immediate repeats. **Quality bar** in `quality.ts` (min summary length, reject URL-only / teaser junk).
5. **Soft-close:** When agent goes idle, feed uses countdown UI (`closeCountdownUi`) instead of hard instant hide.
6. **Side features:** Games are a separate webview, gated by `enableGames`.

## Feed sources

Registry in `src/feed/sources/registry.ts`. IDs: cursor, superhuman, rundown, tldr, hn, devto, github, producthunt, geeky (Lobsters / Show HN style). Each source can fail independently. **Scrapers break often;** maintain best-effort, graceful skip.

**Curated tier (superhuman, rundown, tldr):** scrape already-edited newsletter archives (human-written headlines/summaries), not raw firehoses. `superhuman.ts`/`rundown.ts` intentionally leave `summary` unset so the existing `enrichWithOg` og:description pipeline fills it from the linked article page — do not add bespoke summary-scraping to those two files.

**Ben's Bites was tried and dropped (v1.3.1):** its RSS `description` is often a short in-joke tagline and `content:encoded` opens with rambling personal preamble before the actual point — no reliable local heuristic extracts a BLUF-style summary from it. Don't re-add without a real per-post relevance/extraction step, which would require an LLM (against the 100%-local constraint) or a human-maintained per-source parser.

**Ranking (`rank.ts`):** replaces the old pure-random shuffle. Scores each card by source tier (curated > changelog > community > raw aggregator) plus small local heuristic bonuses (specific numbers in title/summary, named byline in `meta`, summary length/richness). 100% local, no LLM or extra network calls. `order.ts` sorts unseen cards by this score plus a small random jitter; seen cards remain fully shuffled.

**Dedup (`dedupe.ts`):** drops near-duplicate cards across sources by title token-overlap before caching, so the same story from two sources doesn't burn two card slots.

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
- docs/MARKETPLACE.md: Open VSX publish / update steps (live listing: ofershap.context-snack)
- AGENTS.md: maintainer feed preview loop

## Out of scope for agents unless asked

- npm library publishing (extension only)
- Auto-opening games on agent busy
- Factory-wide cross-promo in README
