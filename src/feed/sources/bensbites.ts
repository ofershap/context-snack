import { extractArticleSummary } from '../enrich';
import { formatPubDate, httpGet, MOZILLA_UA, stripHtml, summaryText, tagInner, truncate } from '../http';
import { isUselessSummary, MIN_SUMMARY_LENGTH } from '../quality';
import { FeedCard } from '../types';

const BENSBITES_FEED = 'https://www.bensbites.com/feed';

export async function fetchBensBites(limit = 6): Promise<FeedCard[]> {
    const xml = await httpGet(BENSBITES_FEED, MOZILLA_UA);
    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    const cards: FeedCard[] = [];
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && cards.length < limit) {
        const block = match[1];
        const title = tagInner(block, 'title');
        const link = tagInner(block, 'link');
        if (!title || !link) {
            continue;
        }

        const description = stripHtml(tagInner(block, 'description'));
        const contentHtml = tagInner(block, 'content:encoded');
        const richSummary = contentHtml ? extractArticleSummary(contentHtml) : undefined;

        const summary = description.length >= MIN_SUMMARY_LENGTH && !isUselessSummary(description)
            ? description
            : richSummary;

        const enclosureMatch = block.match(/<enclosure\s+[^>]*url="([^"]+)"[^>]*type="image\/[^"]*"/i);
        const pubDate = tagInner(block, 'pubDate');

        cards.push({
            id: `bensbites-${link}`,
            category: 'ai',
            emoji: '🍬',
            source: "Ben's Bites",
            title: truncate(title, 140),
            summary: summary ? summaryText(summary) : undefined,
            meta: formatPubDate(pubDate),
            url: link,
            image: enclosureMatch?.[1]
        });
    }

    return cards;
}
