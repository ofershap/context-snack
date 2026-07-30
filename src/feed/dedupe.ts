import { FeedCard } from './types';

function normalizeTitle(title: string): Set<string> {
    return new Set(
        title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
    );
}

function titleSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) {
        return 0;
    }
    let shared = 0;
    for (const word of a) {
        if (b.has(word)) {
            shared++;
        }
    }
    return shared / Math.min(a.size, b.size);
}

export function dedupeCards(cards: FeedCard[], threshold = 0.6): FeedCard[] {
    const kept: FeedCard[] = [];
    const keptTokens: Set<string>[] = [];

    for (const card of cards) {
        const tokens = normalizeTitle(card.title);
        const isDuplicate = keptTokens.some(existing => titleSimilarity(tokens, existing) >= threshold);
        if (!isDuplicate) {
            kept.push(card);
            keptTokens.push(tokens);
        }
    }

    return kept;
}
