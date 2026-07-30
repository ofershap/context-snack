const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { scoreCard } = require('../out/feed/rank.js');

describe('scoreCard', () => {
    it('scores curated newsletter sources higher than raw aggregators', () => {
        const curated = { id: 'a', category: 'ai', emoji: '🧠', source: 'Superhuman AI', title: 'A model can clone any voice', summary: 'A new model clones voices with startling accuracy in seconds, raising concerns about trust online.' };
        const aggregator = { id: 'b', category: 'dev', emoji: '🚀', source: 'Product Hunt', title: 'New app launch', summary: undefined };
        assert.ok(scoreCard(curated) > scoreCard(aggregator));
    });

    it('rewards specific numbers in title or summary', () => {
        const specific = { id: 'a', category: 'dev', emoji: 'x', source: 'Dev.to', title: 'Snake rendered with 576 browser windows', summary: 'A project using 576 tabs at once.' };
        const vague = { id: 'b', category: 'dev', emoji: 'x', source: 'Dev.to', title: 'A cool project', summary: 'Something interesting happened here.' };
        assert.ok(scoreCard(specific) > scoreCard(vague));
    });

    it('rewards a named byline in meta', () => {
        const withAuthor = { id: 'a', category: 'dev', emoji: 'x', source: 'Dev.to', title: 'Title', meta: 'GrahamTheDev · 78' };
        const withoutAuthor = { id: 'b', category: 'dev', emoji: 'x', source: 'Dev.to', title: 'Title', meta: '78 points' };
        assert.ok(scoreCard(withAuthor) >= scoreCard(withoutAuthor));
    });

    it('does not throw on minimal cards', () => {
        const minimal = { id: 'a', category: 'dev', emoji: 'x', source: 'Unknown Source', title: 'Title' };
        assert.doesNotThrow(() => scoreCard(minimal));
    });
});
