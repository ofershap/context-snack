import { FeedCard } from '../types';
import { httpGet, MOZILLA_UA, stripHtml, summaryText, truncate, utcDateString } from '../http';

const TLDR_AI_BASE = 'https://tldr.tech/ai/';

function parseTldrAiHtml(html: string, limit: number): FeedCard[] {
    const cards: FeedCard[] = [];
    const anchorRegex = /<a\s+[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(html)) !== null && cards.length < limit) {
        const url = match[1];

        try {
            const host = new URL(url).hostname;
            if (host.includes('tldr.tech')) {
                continue;
            }
        } catch {
            continue;
        }

        const rawTitle = stripHtml(match[2]);
        if (/Sponsor/i.test(rawTitle)) {
            continue;
        }
        if (!/minute read|Website/i.test(rawTitle)) {
            continue;
        }

        let title = rawTitle.replace(/\s*\|\s*Website\s*$/i, '').trim();
        if (!title) {
            continue;
        }

        const afterAnchor = html.slice(match.index + match[0].length);
        const blurbEnd = afterAnchor.search(/<a\s|<h[1-6]\b|<\/(?:p|li|div)>/i);
        const blurbRaw = blurbEnd >= 0 ? afterAnchor.slice(0, blurbEnd) : afterAnchor.slice(0, 500);
        const summary = summaryText(stripHtml(blurbRaw));

        if (!summary || summary.length < 40) {
            continue;
        }

        cards.push({
            id: `tldrai-${url}`,
            category: 'ai',
            emoji: '🤖',
            source: 'TLDR AI',
            title: truncate(title, 140),
            summary,
            url
        });
    }

    return cards;
}

export async function fetchTldrAi(limit = 8): Promise<FeedCard[]> {
    const seen = new Set<string>();
    const cards: FeedCard[] = [];

    for (const daysAgo of [0, 1]) {
        if (cards.length >= limit) {
            break;
        }
        try {
            const html = await httpGet(`${TLDR_AI_BASE}${utcDateString(daysAgo)}`, MOZILLA_UA);
            for (const card of parseTldrAiHtml(html, limit - cards.length)) {
                if (seen.has(card.url!)) {
                    continue;
                }
                seen.add(card.url!);
                cards.push(card);
            }
        } catch {
            continue;
        }
    }

    return cards;
}
