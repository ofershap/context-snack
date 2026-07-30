const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    escapeHtml,
    categoryClass,
    cardBody,
    renderCardInnerHtml,
    FEED_CARD_MARKERS
} = require('../out/feed/cardRender.js');
const { buildFeedWebviewHtml } = require('../out/feed/webview/html.js');

describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
        assert.equal(escapeHtml('<script>"\'&</script>'), '&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;');
    });
});

describe('categoryClass', () => {
    it('maps known categories', () => {
        assert.equal(categoryClass('cursor'), 'cat-cursor');
        assert.equal(categoryClass('ai'), 'cat-ai');
        assert.equal(categoryClass('dev'), 'cat-dev');
        assert.equal(categoryClass('social'), 'cat-social');
        assert.equal(categoryClass('fun'), 'cat-fun');
    });

    it('defaults unknown categories to dev', () => {
        assert.equal(categoryClass('unknown'), 'cat-dev');
    });
});

describe('cardBody', () => {
    it('returns empty when summary and subtitle are missing', () => {
        const body = cardBody({
            title: 'Hello',
            category: 'dev',
            source: 'Hacker News'
        });
        assert.equal(body, '');
    });

    it('uses summary when provided', () => {
        const body = cardBody({
            title: 'Hello',
            summary: '  A useful summary  ',
            category: 'ai',
            source: 'TLDR AI'
        });
        assert.equal(body, 'A useful summary');
    });

    it('uses subtitle when summary is missing (legacy cache)', () => {
        const body = cardBody({
            title: 'Hello',
            subtitle: '  Legacy summary  ',
            category: 'ai',
            source: 'TLDR AI'
        });
        assert.equal(body, 'Legacy summary');
    });

    it('prefers summary over subtitle', () => {
        const body = cardBody({
            title: 'Hello',
            summary: 'New',
            subtitle: 'Old',
            category: 'ai',
            source: 'TLDR AI'
        });
        assert.equal(body, 'New');
    });

    it('returns empty for cursor cards without summary', () => {
        const body = cardBody({
            title: 'Update',
            category: 'cursor',
            source: 'Cursor Changelog'
        });
        assert.equal(body, '');
    });
});

describe('renderCardInnerHtml', () => {
    const baseCard = {
        id: 'test-1',
        category: 'dev',
        emoji: '💻',
        source: 'Test Source',
        title: 'Test Title',
        url: 'https://example.com',
        meta: 'Today'
    };

    it('includes title but omits body when no summary', () => {
        const html = renderCardInnerHtml(baseCard);
        assert.match(html, /Test Title/);
        assert.doesNotMatch(html, /card-body/);
        assert.doesNotMatch(html, /Quick hit/);
    });

    it('renders summary in body when provided', () => {
        const html = renderCardInnerHtml({
            ...baseCard,
            summary: 'A C++ SDK for interacting with Quip smart contracts on Ethereum networks.'
        });
        assert.match(html, /card-body/);
        assert.match(html, /Quip smart contracts/);
    });

    it('includes category class on badge', () => {
        const html = renderCardInnerHtml({ ...baseCard, category: 'ai' });
        assert.match(html, /cat-ai/);
    });

    it('renders image when provided', () => {
        const html = renderCardInnerHtml({
            ...baseCard,
            summary: 'A useful summary that explains why you should care about this.',
            image: 'https://example.com/cover.png'
        });
        assert.match(html, /card-image/);
        assert.match(html, /https:\/\/example\.com\/cover\.png/);
    });

    it('includes open cue when url is present', () => {
        const html = renderCardInnerHtml(baseCard);
        assert.match(html, /card-open/);
        assert.match(html, /Open ↗/);
    });

    it('escapes title in output', () => {
        const html = renderCardInnerHtml({ ...baseCard, title: '<bad>' });
        assert.match(html, /&lt;bad&gt;/);
        assert.doesNotMatch(html, /<bad>/);
    });
});

describe('feed webview html', () => {
    it('contains structural CSS markers', () => {
        const html = buildFeedWebviewHtml();
        for (const marker of FEED_CARD_MARKERS) {
            assert.match(html, new RegExp(marker), `missing marker: ${marker}`);
        }
    });
});
