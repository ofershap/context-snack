import { enrichWithOg } from './enrich';
import { isUselessSummary } from './quality';
import { FeedCard } from './types';
import { FEED_SOURCES, FeedSourceId, resolveEnabledSourceIds } from './sources/registry';

export type SourceFetchResult = {
    sourceKey: string;
    label: string;
    ok: boolean;
    error?: string;
    rawCount: number;
    cards: FeedCard[];
};

function interleaveByCategory(cards: FeedCard[]): FeedCard[] {
    const buckets = new Map<string, FeedCard[]>();
    for (const card of cards) {
        const bucket = buckets.get(card.source) ?? [];
        bucket.push(card);
        buckets.set(card.source, bucket);
    }

    const bucketList = Array.from(buckets.values());
    const result: FeedCard[] = [];
    let remaining = cards.length;

    while (remaining > 0) {
        for (const bucket of bucketList) {
            const next = bucket.shift();
            if (next) {
                result.push(next);
                remaining--;
            }
        }
    }

    return result;
}

async function finalizeCards(raw: FeedCard[]): Promise<FeedCard[]> {
    await enrichWithOg(raw);
    for (const card of raw) {
        if (card.summary && isUselessSummary(card.summary)) {
            card.summary = undefined;
        }
    }
    return raw.filter(c => c.summary && !isUselessSummary(c.summary));
}

function sourcesFor(enabledIds?: FeedSourceId[]) {
    const enabled = new Set(enabledIds ?? resolveEnabledSourceIds());
    return FEED_SOURCES.filter(s => enabled.has(s.id));
}

export async function fetchCardsBySource(enabledIds?: FeedSourceId[]): Promise<SourceFetchResult[]> {
    const results: SourceFetchResult[] = [];
    for (const job of sourcesFor(enabledIds)) {
        try {
            const raw = await job.fetch();
            const cards = await finalizeCards(raw);
            results.push({
                sourceKey: job.id,
                label: job.label,
                ok: true,
                rawCount: raw.length,
                cards
            });
        } catch (error) {
            results.push({
                sourceKey: job.id,
                label: job.label,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
                rawCount: 0,
                cards: []
            });
        }
    }
    return results;
}

export async function fetchAllCards(enabledIds?: FeedSourceId[]): Promise<FeedCard[]> {
    const jobs = sourcesFor(enabledIds);
    const settled = await Promise.allSettled(jobs.map(j => j.fetch()));
    const cards: FeedCard[] = [];
    for (const result of settled) {
        if (result.status === 'fulfilled') {
            cards.push(...result.value);
        }
    }
    const filtered = await finalizeCards(cards);
    return interleaveByCategory(filtered);
}
