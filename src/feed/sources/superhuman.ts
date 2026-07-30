import { FeedCard } from '../types';
import { httpGet, MOZILLA_UA, stripHtml, truncate } from '../http';
import { isUselessSummary } from '../quality';

const SUPERHUMAN_ARCHIVE = 'https://www.superhuman.ai/archive';
const SUPERHUMAN_BASE = 'https://www.superhuman.ai';
const ISSUES_TO_SCAN = 4;
const MAX_STORIES_PER_ISSUE = 3;

interface SuperhumanStory {
    title: string;
    summary: string;
}

function stripTrailingCta(text: string): string {
    return text.replace(/\s+(Learn more\b[^.]*\.|Read more\b[^.]*\.)\s*$/i, '').trim();
}

// Each issue is a multi-story digest. The subject-line headline (and its
// archive listing/og:image) only represents one of those stories, which is
// what caused cards showing e.g. a jet headline with an orca photo. The
// numbered "1. Headline: two sentences" items inside the issue body are each
// a genuinely self-contained, already-BLUF story, so we pull those directly
// instead of the whole-page headline/description/image.
function extractNumberedStories(html: string): SuperhumanStory[] {
    const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ');
    const paragraphs = [...cleaned.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => stripHtml(m[1]));

    const stories: SuperhumanStory[] = [];
    for (const paragraph of paragraphs) {
        const match = paragraph.match(/^\d+\.\s+([^:]{4,90}):\s+(.{40,})$/);
        if (!match) {
            continue;
        }
        const summary = stripTrailingCta(match[2].trim());
        if (isUselessSummary(summary)) {
            continue;
        }
        stories.push({ title: truncate(match[1].trim(), 140), summary: truncate(summary, 420) });
    }
    return stories;
}

async function listRecentIssuePaths(limit: number): Promise<string[]> {
    const html = await httpGet(SUPERHUMAN_ARCHIVE, MOZILLA_UA);
    const anchorRegex = /<a\s+href="(\/p\/[^"?#]+)"[^>]*aria-label="[^"]*"/gi;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = anchorRegex.exec(html)) !== null && seen.size < limit) {
        seen.add(match[1]);
    }

    return [...seen];
}

export async function fetchSuperhumanAi(limit = 6): Promise<FeedCard[]> {
    const issuePaths = await listRecentIssuePaths(ISSUES_TO_SCAN);
    const cards: FeedCard[] = [];

    for (const path of issuePaths) {
        if (cards.length >= limit) {
            break;
        }
        const url = `${SUPERHUMAN_BASE}${path}`;
        try {
            const html = await httpGet(url, MOZILLA_UA);
            const stories = extractNumberedStories(html).slice(0, MAX_STORIES_PER_ISSUE);
            for (const [index, story] of stories.entries()) {
                if (cards.length >= limit) {
                    break;
                }
                cards.push({
                    id: `superhuman-${path}-${index}`,
                    category: 'ai',
                    emoji: '🧠',
                    source: 'Superhuman AI',
                    title: story.title,
                    summary: story.summary,
                    url
                });
            }
        } catch {
            continue;
        }
    }

    return cards;
}
