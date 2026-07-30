import { FeedCard } from '../types';
import { httpGet, MOZILLA_UA, stripHtml, truncate } from '../http';

const RUNDOWN_ARCHIVE = 'https://www.rundown.ai/articles';
const RUNDOWN_BASE = 'https://www.rundown.ai';

export async function fetchRundownAi(limit = 6): Promise<FeedCard[]> {
    const html = await httpGet(RUNDOWN_ARCHIVE, MOZILLA_UA);
    const cardRegex = /<a\s+href="(\/articles\/[^"?#]+)"\s+class="hp-latest_card[^>]*>([\s\S]*?)<\/a>/gi;
    const seen = new Set<string>();
    const cards: FeedCard[] = [];
    let match: RegExpExecArray | null;

    while ((match = cardRegex.exec(html)) !== null && cards.length < limit) {
        const pathPart = match[1];
        const block = match[2];
        if (seen.has(pathPart)) {
            continue;
        }

        const titleMatch = block.match(/fs-cmsfilter-field="title"[^>]*>([\s\S]*?)<\/p>/i);
        const title = titleMatch ? stripHtml(titleMatch[1]).trim() : '';
        if (!title) {
            continue;
        }
        seen.add(pathPart);

        const authorMatch = block.match(/fs-cmsfilter-field="author"[^>]*>([\s\S]*?)<\/span>/i);
        const readTimeMatch = block.match(/fs-cmsfilter-field="read-time"[^>]*>([\s\S]*?)<\/span>/i);
        const author = authorMatch ? stripHtml(authorMatch[1]).trim() : undefined;
        const readTime = readTimeMatch ? stripHtml(readTimeMatch[1]).trim() : undefined;
        const meta = [author, readTime].filter(Boolean).join(' · ') || undefined;

        cards.push({
            id: `rundown-${pathPart}`,
            category: 'ai',
            emoji: '📡',
            source: 'The Rundown AI',
            title: truncate(title, 140),
            meta,
            url: `${RUNDOWN_BASE}${pathPart}`
        });
    }

    return cards;
}
