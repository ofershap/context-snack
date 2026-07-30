import { isUselessSummary, MIN_SNACK_SUMMARY_LENGTH } from './quality';
import { FeedCard } from './types';
import { httpGet, MOZILLA_UA, stripHtml, summaryText } from './http';

function extractOgDescription(html: string): string | undefined {
    const patterns = [
        /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i,
        /<meta\s+content=["']([^"']*)["']\s+property=["']og:description["']/i,
        /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i,
        /<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]?.trim()) {
            return stripHtml(match[1]).trim();
        }
    }

    return undefined;
}

function extractOgImage(html: string): string | undefined {
    const patterns = [
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
        /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
        /<meta\s+property=["']og:image:url["']\s+content=["']([^"']+)["']/i,
        /<meta\s+content=["']([^"']+)["']\s+property=["']og:image:url["']/i
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]?.trim().startsWith('http')) {
            return match[1].trim();
        }
    }

    return undefined;
}

export function extractArticleSummary(html: string): string | undefined {
    const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
    const paragraphs = [...cleaned.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m => stripHtml(m[1]))
        .filter(p => p.length >= 40 && !isUselessSummary(p));
    if (paragraphs.length === 0) {
        return undefined;
    }
    let combined = paragraphs[0];
    for (let i = 1; i < paragraphs.length && combined.length < 180; i++) {
        combined = `${combined} ${paragraphs[i]}`;
    }
    return summaryText(combined);
}

function stripMarkdownInline(text: string): string {
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseReadmeFirstParagraph(readme: string): string | undefined {
    const lines = readme.split(/\r?\n/);
    let inCodeFence = false;
    const blocks: string[] = [];
    let current: string[] = [];

    const flush = () => {
        if (current.length > 0) {
            blocks.push(current.join(' '));
            current = [];
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('```')) {
            inCodeFence = !inCodeFence;
            flush();
            continue;
        }
        if (inCodeFence) {
            continue;
        }
        if (!trimmed || /^[-*_]{3,}$/.test(trimmed)) {
            flush();
            continue;
        }
        if (trimmed.startsWith('#')) {
            flush();
            continue;
        }
        if (trimmed.startsWith('![') || trimmed.startsWith('[![')) {
            flush();
            continue;
        }

        current.push(trimmed);
    }

    flush();

    for (const block of blocks) {
        const cleaned = stripMarkdownInline(block);
        if (cleaned && !isUselessSummary(cleaned)) {
            return cleaned;
        }
    }

    return undefined;
}

async function fetchReadmeDescription(owner: string, repo: string): Promise<string | undefined> {
    for (const branch of ['HEAD', 'master', 'main']) {
        try {
            const readme = await httpGet(
                `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`,
                MOZILLA_UA
            );
            const paragraph = parseReadmeFirstParagraph(readme);
            if (paragraph && !isUselessSummary(paragraph)) {
                return summaryText(paragraph);
            }
        } catch {
            continue;
        }
    }
    return undefined;
}

export async function fetchGithubRepoDescription(url: string): Promise<string | undefined> {
    const repoMatch = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!repoMatch) {
        return undefined;
    }
    const owner = repoMatch[1];
    const repo = repoMatch[2];
    try {
        const repoJson = await httpGet(
            `https://api.github.com/repos/${owner}/${repo}`,
            MOZILLA_UA
        );
        const parsed = JSON.parse(repoJson) as { description?: string };
        const desc = parsed.description?.trim();
        if (desc && !isUselessSummary(desc) && desc.length >= MIN_SNACK_SUMMARY_LENGTH) {
            return summaryText(desc);
        }
    } catch {
        return fetchReadmeDescription(owner, repo);
    }
    return fetchReadmeDescription(owner, repo);
}

function needsRicherSummary(card: FeedCard): boolean {
    if (!card.summary || isUselessSummary(card.summary)) {
        return true;
    }
    if (card.source === 'Cursor Changelog') {
        return false;
    }
    return card.summary.trim().length < MIN_SNACK_SUMMARY_LENGTH;
}

export async function enrichWithOg(cards: FeedCard[]): Promise<void> {
    const pending = cards.filter(c =>
        c.url && (needsRicherSummary(c) || !c.image)
    );
    let cursor = 0;

    async function worker(): Promise<void> {
        while (cursor < pending.length) {
            const card = pending[cursor++];
            if (!card.url) {
                continue;
            }
            try {
                if (needsRicherSummary(card) && /github\.com\//i.test(card.url)) {
                    const gh = await fetchGithubRepoDescription(card.url);
                    if (gh && (!card.summary || gh.length > card.summary.length)) {
                        card.summary = gh;
                    }
                }

                if (!needsRicherSummary(card) && card.image) {
                    continue;
                }

                const html = await httpGet(card.url, MOZILLA_UA);
                if (needsRicherSummary(card)) {
                    const desc = extractOgDescription(html);
                    if (desc && !isUselessSummary(desc) && (!card.summary || desc.length > card.summary.length)) {
                        card.summary = summaryText(desc);
                    }
                }
                if (needsRicherSummary(card)) {
                    const article = extractArticleSummary(html);
                    if (article && !isUselessSummary(article) && (!card.summary || article.length > (card.summary?.length ?? 0))) {
                        card.summary = article;
                    }
                }
                if (!card.image) {
                    const image = extractOgImage(html);
                    if (image) {
                        card.image = image;
                    }
                }
            } catch {
                continue;
            }
        }
    }

    await Promise.all(Array.from({ length: 4 }, () => worker()));
}
