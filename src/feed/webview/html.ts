import { CLOSE_COUNTDOWN_MARKERS, closeCountdownMarkup } from '../closeCountdownUi';
import { FEED_CARD_MARKERS } from '../cardRender';
import { feedWebviewClientJs } from './clientJs';
import { feedWebviewStyles } from './styles';

export function buildFeedWebviewHtml(options?: { gamesEnabled?: boolean }): string {
    const gamesEnabled = options?.gamesEnabled !== false;
    const markersComment = [...FEED_CARD_MARKERS, ...CLOSE_COUNTDOWN_MARKERS].join(' ');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <title>Context Snack</title>
    <!-- markers: ${markersComment} -->
    <style>
${feedWebviewStyles()}
    </style>
</head>
<body>
    <div id="deck">
        <button class="nav-btn side-nav" id="prevBtn" onclick="goPrev()" title="Previous snack" aria-label="Previous snack">◀</button>
        <div id="feed-stage"></div>
        <button class="nav-btn side-nav" id="nextBtn" onclick="goNext()" title="Next snack" aria-label="Next snack">▶</button>
    </div>

    <div id="footer">
        <button class="nav-btn" id="openBtn" onclick="openCurrent()" title="Open in browser" aria-label="Open in browser">↗</button>
        <div id="progress">— / —</div>
        <div id="hint">← → switch snacks · ↑ open in browser</div>
    </div>
    ${closeCountdownMarkup()}

    <script>
${feedWebviewClientJs(gamesEnabled)}
    </script>
</body>
</html>`;
}
