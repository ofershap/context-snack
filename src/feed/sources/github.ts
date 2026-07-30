import { fetchGithubRepoDescription } from '../enrich';
import { httpGet, MOZILLA_UA, stripHtml, summaryText, truncate } from '../http';
import { isUselessSummary } from '../quality';
import { FeedCard } from '../types';

async function fetchGithubTrendingPage(language: string, since: 'daily' | 'weekly' = 'weekly'): Promise<FeedCard[]> {
    const html = await httpGet(`https://github.com/trending/${language}?since=${since}`, MOZILLA_UA);
    const articles = html.match(/<article[\s\S]*?<\/article>/gi) ?? [];
    const cards: FeedCard[] = [];

    for (const [index, article] of articles.entries()) {
        const repoMatch = article.match(/<h2[^>]*>\s*<a[^>]+href="\/([^/]+\/[^"/\s]+)"/i);
        if (!repoMatch) {
            continue;
        }

        const fullName = repoMatch[1];
        const descMatch = article.match(/class="[^"]*color-fg-muted my-1[^"]*"[^>]*>\s*([\s\S]*?)<\/p>/i);
        const description = descMatch ? stripHtml(descMatch[1]) : undefined;
        const periodMatch = article.match(/([\d,]+)\s+stars?\s+(?:today|this week|this month)/i);
        const meta = periodMatch
            ? `★${periodMatch[1]} this ${since === 'daily' ? 'day' : 'week'}`
            : undefined;

        const summary = description && !isUselessSummary(description)
            ? summaryText(description)
            : undefined;

        cards.push({
            id: `github-${language}-${index}-${fullName}`,
            category: 'dev',
            emoji: '🐙',
            source: 'GitHub Trending',
            title: truncate(fullName, 140),
            summary,
            meta,
            url: `https://github.com/${fullName}`,
            image: `https://opengraph.githubassets.com/1/${fullName}`
        });
    }

    return cards;
}

export async function fetchGithubTrending(limit = 8): Promise<FeedCard[]> {
    const results = await Promise.allSettled([
        fetchGithubTrendingPage('typescript'),
        fetchGithubTrendingPage('javascript')
    ]);

    const byRepo = new Map<string, FeedCard>();
    for (const result of results) {
        if (result.status !== 'fulfilled') {
            continue;
        }
        for (const card of result.value) {
            const key = card.title.toLowerCase();
            if (!byRepo.has(key)) {
                byRepo.set(key, card);
            }
        }
    }

    const merged = Array.from(byRepo.values());
    const withSummary: FeedCard[] = [];
    for (const card of merged) {
        if (card.summary) {
            withSummary.push(card);
            continue;
        }
        if (card.url) {
            const summary = await fetchGithubRepoDescription(card.url);
            if (summary) {
                card.summary = summary;
                withSummary.push(card);
            }
        }
    }

    return withSummary.slice(0, limit);
}
