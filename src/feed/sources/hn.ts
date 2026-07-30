import { isUselessSummary } from '../quality';
import { CardCategory, FeedCard } from '../types';
import { httpGet, stripHtml, summaryText, truncate } from '../http';

const HN_ALGOLIA = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12';

interface HnHit {
    objectID: string;
    title: string;
    url?: string;
    story_text?: string;
    points: number;
    num_comments: number;
}

export async function fetchHackerNews(): Promise<FeedCard[]> {
    const body = await httpGet(HN_ALGOLIA);
    const parsed = JSON.parse(body) as { hits?: HnHit[] };
    const hits = parsed.hits ?? [];

    return hits.map(hit => {
        const storySummary = hit.story_text ? stripHtml(hit.story_text) : undefined;
        return {
        id: `hn-${hit.objectID}`,
        category: 'dev' as CardCategory,
        emoji: '💻',
        source: 'Hacker News',
        title: truncate(hit.title, 140),
        summary: storySummary && !isUselessSummary(storySummary)
            ? summaryText(storySummary)
            : undefined,
        meta: `▲${hit.points}  ${hit.num_comments} comments`,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
    };
    });
}
