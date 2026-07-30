<p align="center">
  <h1>Context Snack</h1>
</p>

<p align="center"><strong>Micro-learnings while your agent works - because developers never have enough context switches.</strong></p>

<p align="center">
  <a href="https://github.com/ofershap/context-snack#quick-start"><strong>Try It</strong></a>
  ·
  <a href="https://github.com/ofershap/context-snack/releases"><strong>Install</strong></a>
  ·
  <a href="SECURITY.md"><strong>Privacy</strong></a>
</p>

<p align="center">
  <a href="https://github.com/ofershap/context-snack/stargazers"><img src="https://img.shields.io/github/stars/ofershap/context-snack?style=social" alt="GitHub stars"></a>
  <a href="https://github.com/ofershap/context-snack/actions/workflows/ci.yml"><img src="https://github.com/ofershap/context-snack/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/ofershap/context-snack/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome"></a>
</p>

## Agent is thinking

You asked Cursor to refactor, debug, or ship a feature. The agent is running. That gap is dead time unless you turn it into a tiny learning moment.

**Context Snack** opens a swipeable micro-learning feed when the agent has been busy long enough (configurable). Read a changelog item, skim AI news, or peek at what is trending. Close it when you are done. Optional retro games and mood reactions live on the side: they only open when you click a command or button, never on their own.

Feed sources are scraped or fetched from public sites. Layouts change, APIs shift, and parsers drift. Maintenance is best-effort; a broken source should degrade gracefully, not take down the extension.

## What's different

| | Context Snack | Typical "wait screen" |
| --- | --- | --- |
| **Trigger** | Agent busy in *this* workspace | Manual or always-on distraction |
| **Default surface** | Feed of short cards | Full-screen game or blank panel |
| **Games** | Opt-in via command or in-feed button | Often auto-start |
| **Data** | Local cache, mute, seen state | Often none |
| **Privacy** | No Context Snack server; HTTPS to public feeds only | Varies |

## Quick start

### Install from VSIX (recommended today)

Until the extension is listed on [Open VSX](https://open-vsx.org) for one-click install in Cursor, use a release build:

1. Download `context-snack-*.vsix` from [GitHub Releases](https://github.com/ofershap/context-snack/releases).
2. In Cursor: **Command Palette** → **Extensions: Install from VSIX...** → select the file.
3. Reload or restart Cursor.
4. Run **Context Snack: Open Context Snack** to confirm it loaded.

On first activation the extension installs Cursor hook entries and copies the agent-state hook script into your user `~/.cursor` directory (see [Security & privacy](#security--privacy)).

### Build from source (contributors)

```bash
git clone git@github.com:ofershap/context-snack.git
cd context-snack
npm install
npm run compile
```

Press **F5** (or **Run Extension** from `.vscode/launch.json`) to launch an Extension Development Host, or symlink the folder to `~/.cursor/extensions/context-snack-1.1.0` and reload the window.

Marketplace publishing steps for maintainers: [docs/MARKETPLACE.md](docs/MARKETPLACE.md).

## Security & privacy

Context Snack does not run a backend and does not upload your prompts or workspace code. It merges hook configuration locally, caches feed JSON under `~/.cursor/context-snack/`, and fetches public HTTPS feeds you enable in settings.

Details, uninstall steps, and vulnerability reporting: **[SECURITY.md](SECURITY.md)**.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `contextSnack.autoShow` | `true` | Show the feed while the agent is working in this workspace. |
| `contextSnack.showDelayMs` | `3000` | Milliseconds the agent must stay busy before the feed appears. |
| `contextSnack.feedRefreshMinutes` | `45` | Background refresh interval for the cached feed (min 5). |
| `contextSnack.enableGames` | `true` | Allow **Play a Game** and the in-feed Play control. Games never auto-open. |
| `contextSnack.enableMood` | `true` | Mood reaction command and status bar entry. |
| `contextSnack.sources.cursor` | `true` | Cursor changelog |
| `contextSnack.sources.tldr` | `true` | TLDR AI |
| `contextSnack.sources.hn` | `true` | Hacker News |
| `contextSnack.sources.devto` | `true` | Dev.to |
| `contextSnack.sources.github` | `true` | GitHub Trending |
| `contextSnack.sources.producthunt` | `true` | Product Hunt |
| `contextSnack.sources.geeky` | `true` | Lobsters / Show HN style picks |

Toggle sources in **Settings** → search `contextSnack`.

## Commands

| Command | What it does |
| --- | --- |
| **Context Snack: Open Context Snack** | Open the feed panel manually. |
| **Context Snack: Hide Context Snack** | Close the feed or game panel. |
| **Context Snack: Mute for This Chat** | Skip auto-show for active agent conversations. |
| **Context Snack: Play a Game** | Open Snake, Pong, or Space Invaders (if enabled). |
| **Context Snack: Show Mood Reaction** | Open the mood webview (if enabled). |
| **Context Snack: Show Statistics** | Local snack stats (opens, streaks, etc.). |

**Feed controls:** drag or arrow keys to move between cards; swipe up, Enter, or the link control to open the article; Esc or close to dismiss. When the agent finishes, a short countdown offers a soft close instead of an instant snap shut.

## Architecture (brief)

```text
Cursor hooks (beforeSubmitPrompt, stop, sessionEnd)
        │
        ▼
~/.cursor/hooks/context-snack-agent-state.mjs  →  ~/.cursor/context-snack/busy.json
        │
        ▼
Extension watches busy.json + workspace roots + per-chat mute
        │
        ▼
After showDelayMs → feed webview (cached cards, shuffle + seen tracking)
```

Optional paths: games webview, mood webview, stats. Feed fetchers live in `src/feed/sources/` and run on a timer into the local cache.

## Contributing

Bug fixes, feed source repairs, and UI polish are welcome. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for dev setup, feed verification scripts, and how to add a source.

## Author

<p align="center">
  <a href="https://gitshow.dev/ofershap"><img src="https://gitshow.dev/api/card/ofershap" alt="Made by ofershap"></a>
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/ofershap/"><img src="https://img.shields.io/badge/LinkedIn-ofershap-blue?style=flat&logo=linkedin" alt="LinkedIn"></a>
  <a href="https://github.com/ofershap"><img src="https://img.shields.io/badge/GitHub-ofershap-181717?style=flat&logo=github" alt="GitHub"></a>
</p>

<p align="center">
  <a href="https://github.com/ofershap/context-snack/releases"><strong>Install latest VSIX</strong></a>
  ·
  <a href="https://github.com/ofershap/context-snack/issues"><strong>Report an issue</strong></a>
</p>

MIT License. See [LICENSE](LICENSE).
