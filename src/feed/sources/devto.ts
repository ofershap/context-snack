import { isUselessSummary } from '../quality';
import { FeedCard } from '../types';
import { httpGet, summaryText, truncate } from '../http';

const DEVTO_API = 'https://dev.to/api/articles?per_page=8&top=7';
const DEVTO_AI_API = 'https://dev.to/api/articles?tag=ai&per_page=6&top=7';

interface DevToArticle {
    id?: number;
    title: string;
    url: string;
    description: string;
    cover_image?: string | null;
    social_image?: string | null;
    user: { name: string };
    positive_reactions_count: number;
    tag_list?: string[];
}

export async function fetchDevTo(): Promise<FeedCard[]> {
    const results = await Promise.allSettled([
        httpGet(DEVTO_API),
        httpGet(DEVTO_AI_API)
    ]);

    const seen = new Set<string>();
    const cards: FeedCard[] = [];

    for (const result of results) {
        if (result.status !== 'fulfilled') {
            continue;
        }
        const articles = JSON.parse(result.value) as DevToArticle[];
        for (const [index, article] of articles.entries()) {
            const url = article.url.startsWith('http') ? article.url : `https://dev.to${article.url}`;
            if (seen.has(url)) {
                continue;
            }
            seen.add(url);
            const image = article.cover_image || article.social_image || undefined;
            cards.push({
                id: `devto-${index}-${url}`,
                category: 'dev',
                emoji: '📝',
                source: 'Dev.to',
                title: truncate(article.title, 140),
                summary: article.description && !isUselessSummary(article.description)
                    ? summaryText(article.description)
                    : undefined,
                meta: `${article.user.name} · ❤️${article.positive_reactions_count}`,
                url,
                image: image || undefined
            });
        }
    }

    return cards.slice(0, 10);
}
