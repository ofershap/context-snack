import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConversationMuteStore } from './conversationMuteStore';

const STALE_MS = 30 * 60 * 1000;

interface ConversationEntry {
    startedAt?: number;
    workspaceRoots?: string[];
}

interface AgentBusyState {
    busy?: boolean;
    conversations?: Record<string, ConversationEntry>;
    updatedAt?: number;
}

export class AgentStateWatcher implements vscode.Disposable {
    private readonly statePath: string;
    private watcher: fs.FSWatcher | undefined;
    private pollTimer: NodeJS.Timeout | undefined;
    private showTimer: NodeJS.Timeout | undefined;
    private lastBusy = false;
    private isShowing = false;

    constructor(
        private readonly onBusy: () => void,
        private readonly onIdle: () => void,
        private readonly getWorkspaceRoots: () => string[],
        private readonly getShowDelayMs: () => number,
        private readonly muteStore: ConversationMuteStore,
        private readonly onBusyAgain?: () => void
    ) {
        const dir = path.join(os.homedir(), '.cursor', 'context-snack');
        this.statePath = path.join(dir, 'busy.json');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.startWatching();
    }

    muteActiveConversations(): string[] {
        const ids = this.getActiveConversationIds();
        if (ids.length === 0) {
            return [];
        }
        this.muteStore.mute(ids);
        this.cancelScheduledShow();
        this.lastBusy = false;
        this.isShowing = false;
        return ids;
    }

    private readState(): AgentBusyState | undefined {
        try {
            if (!fs.existsSync(this.statePath)) {
                return undefined;
            }
            return JSON.parse(fs.readFileSync(this.statePath, 'utf-8')) as AgentBusyState;
        } catch {
            return undefined;
        }
    }

    private matchesCurrentWorkspace(entryRoots: string[] | undefined): boolean {
        if (!entryRoots || entryRoots.length === 0) {
            return false;
        }

        const currentRoots = this.getWorkspaceRoots();
        if (currentRoots.length === 0) {
            return false;
        }

        const normalizedCurrent = currentRoots.map(root => path.resolve(root));
        return entryRoots.some(root => normalizedCurrent.includes(path.resolve(root)));
    }

    private getActiveConversationIds(): string[] {
        const state = this.readState();
        const conversations = state?.conversations;
        if (!conversations) {
            return [];
        }

        const now = Date.now();
        const ids: string[] = [];
        for (const [id, entry] of Object.entries(conversations)) {
            if (entry.startedAt !== undefined && now - entry.startedAt > STALE_MS) {
                continue;
            }
            if (!this.matchesCurrentWorkspace(entry.workspaceRoots)) {
                continue;
            }
            ids.push(id);
        }
        return ids;
    }

    private isEffectivelyBusy(state: AgentBusyState | undefined): boolean {
        const conversations = state?.conversations;
        if (!conversations) {
            this.muteStore.pruneTo(new Set());
            return false;
        }

        const now = Date.now();
        let busy = false;

        for (const [id, entry] of Object.entries(conversations)) {
            if (entry.startedAt !== undefined && now - entry.startedAt > STALE_MS) {
                continue;
            }
            if (!this.matchesCurrentWorkspace(entry.workspaceRoots)) {
                continue;
            }
            if (!this.muteStore.isMuted(id)) {
                busy = true;
            }
        }

        this.muteStore.pruneTo(new Set(Object.keys(conversations)));
        return busy;
    }

    private handleStateChange() {
        const busy = this.isEffectivelyBusy(this.readState());
        if (busy === this.lastBusy) {
            return;
        }

        this.lastBusy = busy;

        if (busy) {
            this.onBusyAgain?.();
            this.scheduleShow();
        } else {
            this.cancelScheduledShow();
            if (this.isShowing) {
                this.isShowing = false;
                this.onIdle();
            }
        }
    }

    private scheduleShow() {
        this.cancelScheduledShow();
        const delay = Math.max(0, this.getShowDelayMs());
        this.showTimer = setTimeout(() => {
            this.showTimer = undefined;
            if (this.isEffectivelyBusy(this.readState())) {
                this.isShowing = true;
                this.onBusy();
            }
        }, delay);
    }

    private cancelScheduledShow() {
        if (this.showTimer) {
            clearTimeout(this.showTimer);
            this.showTimer = undefined;
        }
    }

    private startWatching() {
        this.handleStateChange();

        const dir = path.dirname(this.statePath);
        try {
            this.watcher = fs.watch(dir, () => {
                this.handleStateChange();
            });
        } catch {
            // fs.watch can fail; polling covers it
        }

        this.pollTimer = setInterval(() => this.handleStateChange(), 500);
    }

    dispose() {
        this.cancelScheduledShow();
        this.watcher?.close();
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
    }
}
