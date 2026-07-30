import { FeedCard } from '../types';
import { decodeEntities, httpGet, MOZILLA_UA, truncate } from '../http';

const SUPERHUMAN_ARCHIVE = 'https://www.superhuman.ai/archive';
const SUPERHUMAN_BASE = 'https://www.superhuman.ai';

export async function fetchSuperhumanAi(limit = 6): Promise<FeedCard[]> {
    const html = await httpGet(SUPERHUMAN_ARCHIVE, MOZILLA_UA);
    const anchorRegex = /<a\s+href="(\/p\/[^"?#]+)"[^>]*aria-label="([^"]*)"/gi;
    const seen = new Set<string>();
    const cards: FeedCard[] = [];
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(html)) !== null && cards.length < limit) {
        const pathPart = match[1];
        const title = decodeEntities(match[2]).trim();
        if (!title || seen.has(pathPart)) {
            continue;
        }
        seen.add(pathPart);

        cards.push({
            id: `superhuman-${pathPart}`,
            category: 'ai',
            emoji: '🧠',
            source: 'Superhuman AI',
            title: truncate(title, 140),
            url: `${SUPERHUMAN_BASE}${pathPart}`
        });
    }

    return cards;
}
