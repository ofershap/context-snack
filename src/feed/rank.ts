import { FeedCard } from './types';

type SourceTier = 'curated' | 'changelog' | 'community' | 'aggregator';

const CURATED_SOURCES = new Set(['Superhuman AI', 'The Rundown AI', "Ben's Bites", 'TLDR AI']);
const CHANGELOG_SOURCES = new Set(['Cursor Changelog']);
const AGGREGATOR_SOURCES = new Set(['Hacker News', 'GitHub Trending', 'Product Hunt']);

const TIER_WEIGHT: Record<SourceTier, number> = {
    curated: 100,
    changelog: 85,
    community: 70,
    aggregator: 40
};

function sourceTier(source: string): SourceTier {
    if (CURATED_SOURCES.has(source)) {
        return 'curated';
    }
    if (CHANGELOG_SOURCES.has(source)) {
        return 'changelog';
    }
    if (AGGREGATOR_SOURCES.has(source)) {
        return 'aggregator';
    }
    return 'community';
}

function specificityBonus(text: string): number {
    const matches = text.match(/\d[\d,.]*/g);
    if (!matches) {
        return 0;
    }
    return Math.min(matches.length * 6, 18);
}

function bylineBonus(meta: string | undefined): number {
    if (!meta) {
        return 0;
    }
    return /[A-Za-z]{3,}\s*[\u00b7-]/.test(meta) ? 10 : 0;
}

function summaryRichnessScore(summary: string | undefined): number {
    if (!summary) {
        return 0;
    }
    const len = summary.trim().length;
    if (len >= 100 && len <= 320) {
        return 12;
    }
    if (len >= 60) {
        return 6;
    }
    return 0;
}

export function scoreCard(card: FeedCard): number {
    const tier = sourceTier(card.source);
    let score = TIER_WEIGHT[tier];
    score += specificityBonus(`${card.title} ${card.summary ?? ''}`);
    score += bylineBonus(card.meta);
    score += summaryRichnessScore(card.summary);
    return score;
}
