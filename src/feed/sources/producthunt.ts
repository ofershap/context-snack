import { CardCategory, FeedCard } from '../types';
import { httpGet, summaryText, truncate } from '../http';

const TIDE_BASE = 'https://tide-now.com/api/sources/';

interface TideItem {
    id: string;
    title: string;
    url?: string;
    extra?: string;
}

export async function fetchProductHunt(limit = 6): Promise<FeedCard[]> {
    const body = await httpGet(`${TIDE_BASE}producthunt`);
    const parsed = JSON.parse(body) as { items?: TideItem[] };
    const items = parsed.items ?? [];

    return items.slice(0, limit).map((item, index) => ({
        id: `producthunt-${index}-${item.id ?? item.title}`,
        category: 'dev' as CardCategory,
        emoji: '🚀',
        source: 'Product Hunt',
        title: truncate(item.title, 140),
        summary: item.extra ? summaryText(item.extra) : undefined,
        url: item.url
    }));
}
