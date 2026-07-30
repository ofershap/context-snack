import { FeedCard } from '../types';
import { httpGet, MOZILLA_UA, stripHtml, summaryText, truncate } from '../http';

const HN_SHOW_AI = 'https://hn.algolia.com/api/v1/search?query=AI%20OR%20LLM%20OR%20GPT%20OR%20Claude%20OR%20agent&tags=show_hn&hitsPerPage=10';
const LOBSTERS_HOTTEST = 'https://lobste.rs/hottest.json';

interface HnHit {
    objectID: string;
    title: string;
    url?: string;
    story_text?: string;
    points: number;
    num_comments: number;
}

interface LobstersStory {
    short_id: string;
    title: string;
    url?: string;
    description?: string;
    score?: number;
    comment_count?: number;
    tags?: string[];
    comments_url?: string;
}

export async function fetchGeekyFun(limit = 8): Promise<FeedCard[]> {
    const cards: FeedCard[] = [];
    const seen = new Set<string>();

    const push = (card: FeedCard) => {
        const key = card.url || card.id;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        cards.push(card);
    };

    try {
        const lobsters = JSON.parse(await httpGet(LOBSTERS_HOTTEST, MOZILLA_UA)) as LobstersStory[];
        const funTags = new Set(['vibecoding', 'ai', 'ml', 'satire', 'culture', 'compsci', 'programming']);
        for (const story of lobsters) {
            if (cards.length >= limit) {
                break;
            }
            const tags = story.tags ?? [];
            if (!tags.some(tag => funTags.has(tag))) {
                continue;
            }
            const summary = story.description
                ? summaryText(stripHtml(story.description))
                : undefined;
            push({
                id: `lobsters-${story.short_id}`,
                category: 'fun',
                emoji: '🦞',
                source: 'Lobsters',
                title: truncate(story.title, 140),
                summary,
                meta: tags.includes('vibecoding')
                    ? `vibecoding · ▲${story.score ?? 0}`
                    : `▲${story.score ?? 0}  ${story.comment_count ?? 0} comments`,
                url: story.url || story.comments_url
            });
        }
    } catch {
        // optional source
    }

    try {
        const parsed = JSON.parse(await httpGet(HN_SHOW_AI)) as { hits?: HnHit[] };
        for (const hit of parsed.hits ?? []) {
            if (cards.length >= limit) {
                break;
            }
            if (!hit.story_text || hit.story_text.trim().length < 40) {
                continue;
            }
            push({
                id: `showhn-${hit.objectID}`,
                category: 'fun',
                emoji: '😄',
                source: 'Show HN',
                title: truncate(hit.title, 140),
                summary: summaryText(stripHtml(hit.story_text)),
                meta: `▲${hit.points}  ${hit.num_comments} comments`,
                url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
            });
        }
    } catch {
        // optional source
    }

    return cards.slice(0, limit);
}
