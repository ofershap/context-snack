const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { dedupeCards } = require('../out/feed/dedupe.js');

describe('dedupeCards', () => {
    it('drops near-duplicate titles across sources', () => {
        const cards = [
            { id: 'a', category: 'ai', emoji: 'x', source: 'TLDR AI', title: 'Moonshot releases full weights for Kimi K3 model' },
            { id: 'b', category: 'ai', emoji: 'x', source: 'Hacker News', title: 'Moonshot AI releases the full weights of Kimi K3' },
            { id: 'c', category: 'dev', emoji: 'x', source: 'Dev.to', title: 'Snake rendered with 576 browser windows' }
        ];
        const result = dedupeCards(cards);
        assert.equal(result.length, 2);
        assert.equal(result.some(c => c.id === 'c'), true);
    });

    it('keeps distinct titles', () => {
        const cards = [
            { id: 'a', category: 'ai', emoji: 'x', source: 'TLDR AI', title: 'OpenAI ships new agent framework' },
            { id: 'b', category: 'ai', emoji: 'x', source: 'The Rundown AI', title: 'Anthropic releases Opus 5 model update' }
        ];
        const result = dedupeCards(cards);
        assert.equal(result.length, 2);
    });
});
