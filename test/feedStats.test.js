const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    nextStreakState,
    nextCardReadState,
    daysBetween,
    CARD_MILESTONES,
    STREAK_MILESTONES
} = require('../out/feed/statsLogic.js');

describe('daysBetween', () => {
    it('counts calendar days', () => {
        assert.equal(daysBetween('2026-07-01', '2026-07-03'), 2);
    });
});

describe('nextStreakState', () => {
    it('starts streak on first visit', () => {
        const result = nextStreakState(
            { totalCardsRead: 0, currentStreak: 0, longestStreak: 0 },
            '2026-07-29'
        );
        assert.equal(result.stats.currentStreak, 1);
        assert.equal(result.stats.lastActiveDate, '2026-07-29');
        assert.equal(result.stats.longestStreak, 1);
        assert.equal(result.milestone, undefined);
    });

    it('does not change streak when opened again same day', () => {
        const stats = {
            totalCardsRead: 5,
            currentStreak: 3,
            longestStreak: 3,
            lastActiveDate: '2026-07-29'
        };
        const result = nextStreakState(stats, '2026-07-29');
        assert.equal(result.stats.currentStreak, 3);
        assert.equal(result.stats.lastActiveDate, '2026-07-29');
        assert.equal(result.milestone, undefined);
    });

    it('increments streak on consecutive day', () => {
        const stats = {
            totalCardsRead: 5,
            currentStreak: 3,
            longestStreak: 3,
            lastActiveDate: '2026-07-28'
        };
        const result = nextStreakState(stats, '2026-07-29');
        assert.equal(result.stats.currentStreak, 4);
        assert.equal(result.stats.longestStreak, 4);
    });

    it('resets streak after a gap', () => {
        const stats = {
            totalCardsRead: 5,
            currentStreak: 7,
            longestStreak: 7,
            lastActiveDate: '2026-07-20'
        };
        const result = nextStreakState(stats, '2026-07-29');
        assert.equal(result.stats.currentStreak, 1);
        assert.equal(result.stats.longestStreak, 7);
    });

    it('returns streak milestone at day 3', () => {
        const stats = {
            totalCardsRead: 0,
            currentStreak: 2,
            longestStreak: 2,
            lastActiveDate: '2026-07-28'
        };
        const result = nextStreakState(stats, '2026-07-29');
        assert.equal(result.stats.currentStreak, 3);
        assert.equal(result.milestone, STREAK_MILESTONES.find(m => m.count === 3).message);
    });
});

describe('nextCardReadState', () => {
    it('increments total cards read', () => {
        const stats = { totalCardsRead: 4, currentStreak: 1, longestStreak: 1 };
        const result = nextCardReadState(stats);
        assert.equal(result.stats.totalCardsRead, 5);
    });

    it('returns card milestone at 10 reads', () => {
        const stats = { totalCardsRead: 9, currentStreak: 1, longestStreak: 1 };
        const result = nextCardReadState(stats);
        assert.equal(result.stats.totalCardsRead, 10);
        assert.equal(result.milestone, CARD_MILESTONES.find(m => m.count === 10).message);
    });

    it('does not return milestone for non-milestone counts', () => {
        const stats = { totalCardsRead: 11, currentStreak: 1, longestStreak: 1 };
        const result = nextCardReadState(stats);
        assert.equal(result.stats.totalCardsRead, 12);
        assert.equal(result.milestone, undefined);
    });
});
