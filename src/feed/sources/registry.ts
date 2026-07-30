import { FeedCard } from '../types';
import { fetchCursorChangelog } from './cursor';
import { fetchDevTo } from './devto';
import { fetchGeekyFun } from './geeky';
import { fetchGithubTrending } from './github';
import { fetchHackerNews } from './hn';
import { fetchProductHunt } from './producthunt';
import { fetchRundownAi } from './rundown';
import { fetchSuperhumanAi } from './superhuman';
import { fetchTldrAi } from './tldr';

export type FeedSourceId =
    | 'cursor'
    | 'superhuman'
    | 'rundown'
    | 'tldr'
    | 'devto'
    | 'hn'
    | 'github'
    | 'producthunt'
    | 'geeky';

export interface FeedSourceDef {
    id: FeedSourceId;
    label: string;
    defaultEnabled: boolean;
    fetch: () => Promise<FeedCard[]>;
}

export const FEED_SOURCES: readonly FeedSourceDef[] = [
    { id: 'cursor', label: 'Cursor Changelog', defaultEnabled: true, fetch: () => fetchCursorChangelog() },
    { id: 'superhuman', label: 'Superhuman AI', defaultEnabled: true, fetch: () => fetchSuperhumanAi() },
    { id: 'rundown', label: 'The Rundown AI', defaultEnabled: true, fetch: () => fetchRundownAi() },
    { id: 'tldr', label: 'TLDR AI', defaultEnabled: true, fetch: () => fetchTldrAi() },
    { id: 'devto', label: 'Dev.to', defaultEnabled: true, fetch: () => fetchDevTo() },
    { id: 'hn', label: 'Hacker News', defaultEnabled: true, fetch: () => fetchHackerNews() },
    { id: 'github', label: 'GitHub Trending', defaultEnabled: true, fetch: () => fetchGithubTrending() },
    { id: 'producthunt', label: 'Product Hunt', defaultEnabled: true, fetch: () => fetchProductHunt() },
    { id: 'geeky', label: 'Lobsters / Show HN', defaultEnabled: true, fetch: () => fetchGeekyFun() }
];

export function getSourceIds(): FeedSourceId[] {
    return FEED_SOURCES.map(s => s.id);
}

export function resolveEnabledSourceIds(sourcesConfig?: Record<string, boolean> | null): FeedSourceId[] {
    return FEED_SOURCES
        .filter(s => {
            if (sourcesConfig && typeof sourcesConfig[s.id] === 'boolean') {
                return sourcesConfig[s.id];
            }
            return s.defaultEnabled;
        })
        .map(s => s.id);
}
