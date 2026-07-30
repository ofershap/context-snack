import { FeedCard } from './types';

export const BODY_MAX_LENGTH = 420;

export const FEED_CARD_MARKERS = [
    'card-body',
    'card-footer',
    'card-open',
    'card-image',
    'card-chrome',
    'cat-cursor',
    'cat-ai',
    'cat-dev',
    'cat-social',
    'cat-fun',
    'feed-stage'
];

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function categoryClass(category: string): string {
    switch (category) {
        case 'cursor':
        case 'ai':
        case 'dev':
        case 'social':
        case 'fun':
            return `cat-${category}`;
        default:
            return 'cat-dev';
    }
}

export function truncateAtBoundary(text: string, maxLength: number): string {
    const trimmed = text.trim();
    if (trimmed.length <= maxLength) {
        return trimmed;
    }

    const slice = trimmed.slice(0, maxLength);
    const sentenceEnds = ['. ', '! ', '? ', '… ']
        .map(mark => slice.lastIndexOf(mark))
        .filter(i => i >= Math.floor(maxLength * 0.45));
    const bestSentence = sentenceEnds.length > 0 ? Math.max(...sentenceEnds) : -1;
    if (bestSentence >= 0) {
        return slice.slice(0, bestSentence + 1).trim();
    }

    const space = slice.lastIndexOf(' ');
    if (space >= Math.floor(maxLength * 0.55)) {
        return `${slice.slice(0, space).trimEnd()}…`;
    }

    return `${slice.trimEnd()}…`;
}

function truncateBody(text: string): string {
    return truncateAtBoundary(text, BODY_MAX_LENGTH);
}

export function cardBody(card: {
    title: string;
    summary?: string;
    subtitle?: string;
    category: string;
    source: string;
}): string {
    const text = (card.summary ?? card.subtitle)?.trim();
    if (text) {
        return truncateBody(text);
    }
    return '';
}

export function renderCardInnerHtml(card: FeedCard): string {
    const body = cardBody(card);

    const badge = `<div class="card-header"><span class="badge ${categoryClass(card.category)}">${escapeHtml(card.emoji)} ${escapeHtml(card.source)}</span></div>`;
    const title = `<h2 class="card-title">${escapeHtml(card.title)}</h2>`;
    const imageHtml = card.image
        ? `<div class="card-image-wrap"><img class="card-image" src="${escapeHtml(card.image)}" alt="" loading="lazy" /></div>`
        : '';
    const bodyHtml = body ? `<p class="card-body">${escapeHtml(body)}</p>` : '';

    const footerParts: string[] = [];
    if (card.meta) {
        footerParts.push(`<span class="card-meta">${escapeHtml(card.meta)}</span>`);
    } else {
        footerParts.push('<span class="card-meta"></span>');
    }
    if (card.url) {
        footerParts.push('<span class="card-open">Open ↗</span>');
    }
    const footer = `<div class="card-footer">${footerParts.join('')}</div>`;

    return badge + title + imageHtml + bodyHtml + footer;
}
