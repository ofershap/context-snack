import * as vscode from 'vscode';
import { FeedCacheManager } from '../cache';
import { orderCardsForSession } from '../order';
import { FeedSeenStore } from '../seen';
import { FeedStatsManager } from '../stats';
import { buildFeedWebviewHtml } from './html';

export class FeedWebviewProvider {
    private panel: vscode.WebviewPanel | null = null;
    private requestGameCallback: (() => void) | undefined;
    private muteChatCallback: (() => void) | undefined;
    private readonly seen = new FeedSeenStore();
    private sessionCards: ReturnType<FeedCacheManager['getCards']> = [];
    private webviewReady = false;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly cache: FeedCacheManager,
        private readonly stats: FeedStatsManager,
        private readonly getGamesEnabled: () => boolean = () => true
    ) {}

    onRequestGame(callback: () => void) {
        this.requestGameCallback = callback;
    }

    onMuteChat(callback: () => void) {
        this.muteChatCallback = callback;
    }

    isOpen(): boolean {
        return this.panel !== null;
    }

    showFeed() {
        if (this.panel) {
            this.cancelCloseCountdown();
            this.panel.reveal(vscode.ViewColumn.One, false);
            this.pushCards(false);
            return;
        }

        this.webviewReady = false;
        this.panel = vscode.window.createWebviewPanel(
            'contextSnackFeed',
            '🍿 Context Snack',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        this.panel.webview.html = buildFeedWebviewHtml({ gamesEnabled: this.getGamesEnabled() });
        this.setupMessageHandling();

        this.panel.onDidDispose(() => {
            this.panel = null;
            this.sessionCards = [];
            this.webviewReady = false;
        });

        this.panel.reveal(vscode.ViewColumn.One, false);

        void this.cache.refreshNow().then(() => {
            if (this.panel && this.webviewReady) {
                this.pushCards(true);
            }
        });
    }

    beginCloseCountdown() {
        if (!this.panel || !this.webviewReady) {
            return;
        }
        this.panel.webview.postMessage({ command: 'startCloseCountdown' });
    }

    cancelCloseCountdown() {
        if (!this.panel || !this.webviewReady) {
            return;
        }
        this.panel.webview.postMessage({ command: 'cancelCloseCountdown' });
    }

    hideFeed() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
    }

    private pushCards(reshuffle: boolean) {
        if (!this.panel || !this.webviewReady) {
            return;
        }

        if (reshuffle || this.sessionCards.length === 0) {
            const achievement = this.stats.onFeedOpened();
            if (achievement) {
                vscode.window.showInformationMessage(achievement);
            }
            this.sessionCards = orderCardsForSession(this.cache.getCards(), this.seen.getSeenIds());
        }

        this.panel.webview.postMessage({
            command: 'loadCards',
            cards: this.sessionCards,
            stats: this.stats.getStats()
        });
    }

    private setupMessageHandling() {
        if (!this.panel) {
            return;
        }

        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'ready':
                    this.webviewReady = true;
                    this.pushCards(true);
                    break;
                case 'openLink':
                    if (message.url) {
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                    }
                    break;
                case 'cardRead': {
                    if (message.id) {
                        this.seen.markSeen(message.id);
                    } else if (typeof message.index === 'number' && this.sessionCards[message.index]) {
                        this.seen.markSeen(this.sessionCards[message.index].id);
                    }
                    const achievement = this.stats.onCardRead();
                    if (achievement) {
                        vscode.window.showInformationMessage(achievement);
                    }
                    break;
                }
                case 'requestGame':
                    if (this.getGamesEnabled()) {
                        this.requestGameCallback?.();
                    }
                    break;
                case 'muteChat':
                    this.muteChatCallback?.();
                    break;
                case 'keepOpen':
                    break;
                case 'confirmClose':
                case 'closeFeed':
                    this.hideFeed();
                    break;
            }
        });
    }
}
