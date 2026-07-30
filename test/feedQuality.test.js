const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    isUselessSummary,
    isUrlOnlySummary,
    isTruncatedTeaser,
    judgeFeedCard
} = require('../out/feed/quality.js');

describe('isUrlOnlySummary', () => {
    it('rejects url-only summary', () => {
        assert.equal(isUrlOnlySummary('https://example.com/article'), true);
        assert.equal(isUselessSummary('https://example.com/article'), true);
    });
});

describe('isTruncatedTeaser', () => {
    it('rejects truncated teaser under 100 chars', () => {
        const teaser = 'This is a short teaser that ends with ellipsis...';
        assert.ok(teaser.length < 100);
        assert.equal(isTruncatedTeaser(teaser), true);
        assert.equal(isUselessSummary(teaser), true);
    });

    it('rejects Dev.to-length teasers around 100+ chars ending with ...', () => {
        const teaser = `${'x'.repeat(100)}...`;
        assert.equal(teaser.length, 103);
        assert.equal(isTruncatedTeaser(teaser), true);
        assert.equal(isUselessSummary(teaser), true);
    });
});

describe('real summaries', () => {
    it('accepts 100+ char summary', () => {
        const summary = 'A'.repeat(100);
        assert.equal(isUselessSummary(summary), false);
    });
});

describe('cursor-like short sentences', () => {
    it('isUselessSummary true when under 40 chars', () => {
        const short = 'A'.repeat(39);
        assert.equal(isUselessSummary(short), true);
    });

    it('isUselessSummary false at 42 chars without ellipsis', () => {
        const sentence = 'Added new feature for agent workflows today';
        assert.ok(sentence.length >= 40);
        assert.equal(isTruncatedTeaser(sentence), false);
        assert.equal(isUselessSummary(sentence), false);
    });
});

describe('judgeFeedCard', () => {
    it('returns issues for missing url and title', () => {
        const issues = judgeFeedCard({ source: 'Test', summary: 'A'.repeat(100) });
        assert.ok(issues.includes('missing title'));
        assert.ok(issues.includes('missing url'));
    });
});
