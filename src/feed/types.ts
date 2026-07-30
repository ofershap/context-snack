export type CardCategory = 'cursor' | 'ai' | 'dev' | 'social' | 'fun';

export interface FeedCard {
    id: string;
    category: CardCategory;
    emoji: string;
    source: string;
    title: string;
    summary?: string;
    meta?: string;
    url?: string;
    image?: string;
}

export interface FeedCacheFile {
    cards: FeedCard[];
    updatedAt: number;
}

export interface FeedStats {
    totalCardsRead: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate?: string;
}
