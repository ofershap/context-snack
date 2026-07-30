import { FeedStats } from './types';

export const CARD_MILESTONES: Array<{ count: number; message: string }> = [
    { count: 10, message: '📚 10 cards deep! You now know slightly more than the agent does.' },
    { count: 25, message: '🧠 25 cards read! Certified doomscroller of productive things.' },
    { count: 50, message: '🚀 50 cards! At this point you should charge for market research.' },
    { count: 100, message: '🏅 100 cards! You have officially out-waited the agent, many times over.' },
    { count: 250, message: '👑 250 cards! Somewhere, a newsletter editor is nervous.' }
];

export const STREAK_MILESTONES: Array<{ count: number; message: string }> = [
    { count: 3, message: '🔥 3-day streak! Consistent procrastination is still consistency.' },
    { count: 7, message: '🔥🔥 7-day streak! A full week of productive idling.' },
    { count: 14, message: '🔥🔥🔥 14-day streak! This might be a habit now.' },
    { count: 30, message: '🏆 30-day streak! You should put this on your résumé.' }
];

export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
    const from = new Date(`${fromIso}T00:00:00Z`).getTime();
    const to = new Date(`${toIso}T00:00:00Z`).getTime();
    return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

export function nextStreakState(
    stats: FeedStats,
    today: string
): { stats: FeedStats; milestone?: string } {
    const last = stats.lastActiveDate;

    if (last === today) {
        return { stats: { ...stats } };
    }

    const next: FeedStats = { ...stats };

    if (last) {
        const gap = daysBetween(last, today);
        next.currentStreak = gap === 1 ? next.currentStreak + 1 : 1;
    } else {
        next.currentStreak = 1;
    }

    next.lastActiveDate = today;
    next.longestStreak = Math.max(next.longestStreak, next.currentStreak);

    const milestone = STREAK_MILESTONES.find(m => m.count === next.currentStreak);
    return { stats: next, milestone: milestone?.message };
}

export function nextCardReadState(stats: FeedStats): { stats: FeedStats; milestone?: string } {
    const next: FeedStats = {
        ...stats,
        totalCardsRead: stats.totalCardsRead + 1
    };
    const milestone = CARD_MILESTONES.find(m => m.count === next.totalCardsRead);
    return { stats: next, milestone: milestone?.message };
}
