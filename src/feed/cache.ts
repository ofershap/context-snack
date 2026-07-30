import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fetchAllCards } from './fetch';
import { FeedSourceId } from './sources/registry';
import { FeedCacheFile, FeedCard } from './types';

const MIN_REFRESH_MINUTES = 5;

export class FeedCacheManager {
    private readonly cachePath: string;
    private cards: FeedCard[] = [];
    private updatedAt = 0;
    private refreshing: Promise<void> | undefined;
    private timer: NodeJS.Timeout | undefined;

    constructor(
        private readonly getRefreshMinutes: () => number,
        private readonly getEnabledSourceIds: () => FeedSourceId[] | undefined = () => undefined
    ) {
        const dir = path.join(os.homedir(), '.cursor', 'context-snack');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.cachePath = path.join(dir, 'feed-cache.json');

        this.loadFromDisk();
        this.scheduleNext();

        const refreshMs = Math.max(MIN_REFRESH_MINUTES, this.getRefreshMinutes()) * 60 * 1000;
        if (Date.now() - this.updatedAt > refreshMs) {
            void this.refreshNow();
        }
    }

    getCards(): FeedCard[] {
        return this.cards;
    }

    getUpdatedAt(): number {
        return this.updatedAt;
    }

    async refreshNow(): Promise<void> {
        if (this.refreshing) {
            return this.refreshing;
        }

        this.refreshing = (async () => {
            try {
                const cards = await fetchAllCards(this.getEnabledSourceIds());
                if (cards.length > 0) {
                    this.cards = cards;
                    this.updatedAt = Date.now();
                    this.saveToDisk();
                }
            } catch (error) {
                console.error('Context Snack: failed to refresh feed cards', error);
            } finally {
                this.refreshing = undefined;
            }
        })();

        return this.refreshing;
    }

    dispose() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    private scheduleNext() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        const refreshMs = Math.max(MIN_REFRESH_MINUTES, this.getRefreshMinutes()) * 60 * 1000;
        this.timer = setInterval(() => void this.refreshNow(), refreshMs);
    }

    private loadFromDisk() {
        try {
            if (!fs.existsSync(this.cachePath)) {
                return;
            }
            const parsed = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8')) as {
                cards?: Array<FeedCard & { subtitle?: string }>;
                updatedAt?: number;
            };
            this.cards = (parsed.cards ?? []).map(card => {
                const summary = card.summary || card.subtitle;
                return {
                    id: card.id,
                    category: card.category,
                    emoji: card.emoji,
                    source: card.source,
                    title: card.title,
                    summary,
                    meta: card.meta,
                    url: card.url,
                    image: card.image
                };
            });
            this.updatedAt = parsed.updatedAt ?? 0;
        } catch (error) {
            console.error('Context Snack: failed to load cached feed', error);
        }
    }

    private saveToDisk() {
        try {
            const payload: FeedCacheFile = { cards: this.cards, updatedAt: this.updatedAt };
            fs.writeFileSync(this.cachePath, JSON.stringify(payload), 'utf-8');
        } catch (error) {
            console.error('Context Snack: failed to save cached feed', error);
        }
    }
}
