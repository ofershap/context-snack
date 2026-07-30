import { FeedCard } from '../types';
import { formatPubDate, httpGet, stripHtml, summaryText, tagInner, truncate } from '../http';

const CURSOR_RSS_URL = 'https://cursor.com/changelog/rss.xml';

export async function fetchCursorChangelog(limit = 6): Promise<FeedCard[]> {
    const xml = await httpGet(CURSOR_RSS_URL);
    const cards: FeedCard[] = [];
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && cards.length < limit) {
        const block = match[1];
        const title = tagInner(block, 'title');
        const link = tagInner(block, 'link');
        const description = stripHtml(tagInner(block, 'description'));
        const pubDate = tagInner(block, 'pubDate');

        if (!title) {
            continue;
        }

        cards.push({
            id: `cursor-${link || title}`,
            category: 'cursor',
            emoji: '🖱️',
            source: 'Cursor Changelog',
            title: truncate(title, 120),
            summary: summaryText(description),
            meta: formatPubDate(pubDate),
            url: link || undefined
        });
    }

    return cards;
}
