import { FeedCard } from './types';

export function shuffleInPlace<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = items[i];
        items[i] = items[j];
        items[j] = tmp;
    }
    return items;
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

    return [...shuffleInPlace(unseen), ...shuffleInPlace(seen)];
}
