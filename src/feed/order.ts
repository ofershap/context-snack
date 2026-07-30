import { FeedCard } from './types';
import { scoreCard } from './rank';

export function shuffleInPlace<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
    }
    return items;
}

function scoreSort(cards: FeedCard[]): FeedCard[] {
    const jitterRange = 8;
    return cards
        .map(card => ({ card, weight: scoreCard(card) + Math.random() * jitterRange }))
        .sort((a, b) => b.weight - a.weight)
        .map(entry => entry.card);
}

export function orderCardsForSession(cards: FeedCard[], seenIds: Set<string>): FeedCard[] {
    const unseen: FeedCard[] = [];
    const seen: FeedCard[] = [];

    for (const card of cards) {
        if (seenIds.has(card.id)) {
            seen.push(card);
        } else {
            unseen.push(card);
        }
    }

    return [...scoreSort(unseen), ...shuffleInPlace(seen)];
}
