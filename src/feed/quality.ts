export const MIN_SUMMARY_LENGTH = 40;
export const MIN_SNACK_SUMMARY_LENGTH = 100;

export function isUrlOnlySummary(text: string): boolean {
    const t = text.trim();
    if (/^https?:\/\/\S+$/i.test(t)) {
        return true;
    }
    const withoutUrls = t.replace(/https?:\/\/\S+/gi, '').trim();
    return withoutUrls.length < 12 && /https?:\/\//i.test(t);
}

export function isTruncatedTeaser(text: string): boolean {
    const t = text.trim();
    if (/\.\.\.$/.test(t) && t.length < 160) {
        return true;
    }
    return false;
}

export function isUselessSummary(text: string): boolean {
    const t = text.trim();
    if (t.length < MIN_SUMMARY_LENGTH) {
        return true;
    }
    if (isUrlOnlySummary(t)) {
        return true;
    }
    if (isTruncatedTeaser(t)) {
        return true;
    }
    if (/Quick hit from/i.test(t)) {
        return true;
    }
    if (/Contribute to .+ development by creating an account on GitHub/i.test(t)) {
        return true;
    }
    if (/^GitHub is where people build software/i.test(t)) {
        return true;
    }
    if (/^We.re on a journey to advance and democratize artificial intelligence/i.test(t)) {
        return true;
    }
    if (/<[a-z][\s\S]*>/i.test(t)) {
        return true;
    }
    return false;
}

export function summaryQualityIssues(summary: string | undefined): string[] {
    const issues: string[] = [];
    if (!summary?.trim()) {
        issues.push('missing summary');
        return issues;
    }
    const t = summary.trim();
    if (t.length < MIN_SUMMARY_LENGTH) {
        issues.push(`too short (${t.length}<${MIN_SUMMARY_LENGTH})`);
    }
    if (isUrlOnlySummary(t)) {
        issues.push('url-only summary');
    }
    if (isTruncatedTeaser(t)) {
        issues.push(`truncated teaser (${t.length} chars)`);
    }
    if (/Quick hit from/i.test(t)) {
        issues.push('fake fallback copy');
    }
    if (/Contribute to .+ development by creating an account on GitHub/i.test(t)) {
        issues.push('github boilerplate');
    }
    if (/^GitHub is where people build software/i.test(t)) {
        issues.push('github marketing blurb');
    }
    if (/^We.re on a journey to advance and democratize artificial intelligence/i.test(t)) {
        issues.push('generic org blurb');
    }
    if (/<[a-z][\s\S]*>/i.test(t)) {
        issues.push('raw HTML leak');
    }
    return issues;
}

export function judgeFeedCard(card: {
    title?: string;
    source?: string;
    summary?: string;
    url?: string;
}): string[] {
    const issues: string[] = [];
    if (!card.title?.trim()) {
        issues.push('missing title');
    }
    if (!card.source?.trim()) {
        issues.push('missing source');
    }
    if (!card.url) {
        issues.push('missing url');
    }
    issues.push(...summaryQualityIssues(card.summary));
    return issues;
}
