# Security and privacy

Context Snack is a local Cursor / VS Code extension. It does not operate a Context Snack cloud service. Your code and chat prompts are not sent to Context Snack.

## What the extension writes on disk

### `~/.cursor/hooks.json`

On activation, the extension **merges** hook entries for Cursor events (`beforeSubmitPrompt`, `stop`, `sessionEnd`). It points them at:

`./hooks/context-snack-agent-state.mjs`

If `hooks.json` cannot be parsed, the extension **logs an error and skips registration**. It does **not** overwrite or wipe your file on parse failure.

### `~/.cursor/hooks/context-snack-agent-state.mjs`

The hook script is copied from the extension package (also shipped under `.cursor/hooks/` in the repo). It runs when Cursor invokes hooks and updates agent busy state.

### `~/.cursor/context-snack/`

Typical files (names may evolve with versions):

| File / area | Purpose |
| --- | --- |
| `busy.json` | Which agent conversations are active; read by the extension to auto-show the feed. |
| Feed cache | Cached card JSON from background refresh. |
| Seen / mute / stats | Local-only preferences and lightweight usage counters. |

Nothing in this directory is uploaded by Context Snack to a vendor server.

## Network behavior

The extension fetches **public** content over **HTTPS** when refreshing feeds. Sources you can enable (via `contextSnack.sources.*`) include:

- Cursor changelog
- TLDR AI
- Hacker News
- Dev.to
- GitHub Trending
- Product Hunt
- Lobsters / geeky aggregators (as implemented in source modules)

Requests use a identifiable user-agent string (`context-snack-vscode-extension`). No API keys for Context Snack are required. Third-party sites may log requests like any normal browser or RSS client.

There is **no** Context Snack API that receives your repository contents, file paths from your project (beyond what you already send to Cursor), or chat transcripts.

## Local-only features

- **Mute for this chat** and conversation mute lists
- **Seen** card tracking and shuffle order
- **Statistics** shown in the extension UI

These stay on your machine under `~/.cursor/context-snack/` (or equivalent paths on your OS).

## Uninstalling hooks

If you remove the extension but want to clean up hooks:

1. Open `~/.cursor/hooks.json`.
2. Remove hook entries whose `command` includes `context-snack-agent-state.mjs` from `beforeSubmitPrompt`, `stop`, and `sessionEnd` (and any legacy `pending-games-agent-state.mjs` entries migrated by older builds).
3. Optionally delete `~/.cursor/hooks/context-snack-agent-state.mjs`.
4. Optionally delete `~/.cursor/context-snack/` if you no longer want cache or stats.

Reload Cursor after editing `hooks.json`.

## Reporting vulnerabilities

Please report security issues responsibly:

- Prefer **[GitHub Security Advisories](https://github.com/ofershap/context-snack/security/advisories/new)** for sensitive reports.
- For non-sensitive bugs, open a [GitHub issue](https://github.com/ofershap/context-snack/issues) with the **security** label if appropriate.

Include steps to reproduce, Cursor version, extension version, and whether hooks were customized.

## Trust boundaries

- **You trust Cursor** to run hook scripts from `~/.cursor/hooks/` with the privileges of your user account.
- **You trust enabled feed origins** to serve content over HTTPS; the extension renders summaries in a webview. Treat opened links like any external site.
- **Workspace gating** limits auto-show to agent work tied to open workspace folders; it is not a sandbox against malicious feed HTML. The feed UI should escape untrusted strings; report XSS concerns via advisories.
