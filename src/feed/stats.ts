import * as vscode from 'vscode';
import { FeedStats } from './types';
import { nextCardReadState, nextStreakState, todayIso } from './statsLogic';

const STORAGE_KEY = 'contextSnack.feedStats';

export class FeedStatsManager {
    private stats: FeedStats;

    constructor() {
        this.stats = this.load();
    }

    getStats(): FeedStats {
        return { ...this.stats };
    }

    onFeedOpened(): string | undefined {
        const result = nextStreakState(this.stats, todayIso());
        const unchanged = this.stats.lastActiveDate === result.stats.lastActiveDate
            && this.stats.currentStreak === result.stats.currentStreak;
        if (unchanged) {
            return undefined;
        }
        this.stats = result.stats;
        this.save();
        return result.milestone;
    }

    onCardRead(): string | undefined {
        const result = nextCardReadState(this.stats);
        this.stats = result.stats;
        this.save();
        return result.milestone;
    }

    private load(): FeedStats {
        try {
            const stored = vscode.workspace.getConfiguration().get<FeedStats>(STORAGE_KEY);
            if (stored) {
                return {
                    totalCardsRead: stored.totalCardsRead ?? 0,
                    currentStreak: stored.currentStreak ?? 0,
                    longestStreak: stored.longestStreak ?? 0,
                    lastActiveDate: stored.lastActiveDate
                };
            }
        } catch (error) {
            console.error('Context Snack: failed to load feed stats', error);
        }
        return { totalCardsRead: 0, currentStreak: 0, longestStreak: 0 };
    }

    private save() {
        try {
            vscode.workspace.getConfiguration().update(STORAGE_KEY, this.stats, vscode.ConfigurationTarget.Global);
        } catch (error) {
            console.error('Context Snack: failed to save feed stats', error);
        }
    }
}
