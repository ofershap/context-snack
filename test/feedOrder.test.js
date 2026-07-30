const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { orderCardsForSession, shuffleInPlace } = require('../out/feed/order.js');

describe('shuffleInPlace', () => {
    it('keeps the same items', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffleInPlace([...input]);
        assert.deepEqual([...result].sort(), input);
    });
});

describe('orderCardsForSession', () => {
    const cards = [
        { id: 'a', category: 'dev', emoji: 'a', source: 'A', title: 'A' },
        { id: 'b', category: 'dev', emoji: 'b', source: 'B', title: 'B' },
        { id: 'c', category: 'dev', emoji: 'c', source: 'C', title: 'C' },
        { id: 'd', category: 'dev', emoji: 'd', source: 'D', title: 'D' }
    ];

    it('puts unseen cards before seen cards', () => {
        const ordered = orderCardsForSession(cards, new Set(['b', 'd']));
        const ids = ordered.map(card => card.id);
        assert.deepEqual(ids.slice(0, 2).sort(), ['a', 'c']);
        assert.deepEqual(ids.slice(2).sort(), ['b', 'd']);
    });

    it('returns all cards when none are seen', () => {
        const ordered = orderCardsForSession(cards, new Set());
        assert.equal(ordered.length, cards.length);
        assert.deepEqual([...ordered.map(c => c.id)].sort(), ['a', 'b', 'c', 'd']);
    });
});
