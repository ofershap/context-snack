import * as https from 'https';
import { BODY_MAX_LENGTH, truncateAtBoundary } from './cardRender';

export const REQUEST_TIMEOUT_MS = 8000;
export const MOZILLA_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function httpGet(url: string, userAgent = 'context-snack-vscode-extension', redirectsLeft = 3): Promise<string> {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { headers: { 'User-Agent': userAgent } }, response => {
            const status = response.statusCode ?? 0;
            if (status >= 300 && status < 400 && response.headers.location && redirectsLeft > 0) {
                response.resume();
                const next = new URL(response.headers.location, url).toString();
                resolve(httpGet(next, userAgent, redirectsLeft - 1));
                return;
            }

            if (status < 200 || status >= 300) {
                response.resume();
                reject(new Error(`Request to ${url} failed with status ${status}`));
                return;
            }

            const chunks: Buffer[] = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            response.on('error', reject);
        });

        request.on('error', reject);
        request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy(new Error(`Request to ${url} timed out`)));
    });
}

export function truncate(text: string, maxLength: number): string {
    return truncateAtBoundary(text, maxLength);
}

export function decodeEntities(text: string): string {
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&apos;/g, '\'')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&bull;/g, '•')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/<[^>]*>/g, '');
}

export function stripHtml(html: string): string {
    return decodeEntities(html).replace(/\s+/g, ' ').trim();
}

export function tagInner(block: string, tag: string): string {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (!match) {
        return '';
    }
    const cdataMatch = match[1].match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    return decodeEntities(cdataMatch ? cdataMatch[1] : match[1]);
}

export function formatPubDate(pubDate: string): string | undefined {
    const parsed = new Date(pubDate);
    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function utcDateString(daysAgo = 0): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

export function summaryText(text: string | undefined): string | undefined {
    if (!text?.trim()) {
        return undefined;
    }
    return truncate(text, BODY_MAX_LENGTH);
}
