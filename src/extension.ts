import * as vscode from 'vscode';
import { AgentStateWatcher } from './agent/agentStateWatcher';
import { ConversationMuteStore } from './agent/conversationMuteStore';
import { installContextSnackHooks } from './agent/hookInstaller';
import { FeedCacheManager } from './feed/cache';
import { resolveEnabledSourceIds } from './feed/sources/registry';
import { FeedStatsManager } from './feed/stats';
import { FeedWebviewProvider } from './feed/webview/provider';
import { GameWebviewProvider } from './games/webviewProvider';
import { MoodReactionProvider } from './mood/reactionProvider';

export async function activate(context: vscode.ExtensionContext) {
    await installContextSnackHooks(context.extensionUri);

    const cfg = () => vscode.workspace.getConfiguration('contextSnack');
    const getFeedRefreshMinutes = () => cfg().get<number>('feedRefreshMinutes', 45);
    const getEnabledSourceIds = () => resolveEnabledSourceIds(cfg().get<Record<string, boolean>>('sources'));
    const gamesEnabled = () => cfg().get<boolean>('enableGames', true);
    const moodEnabled = () => cfg().get<boolean>('enableMood', true);

    const muteStore = new ConversationMuteStore();
    const feedCache = new FeedCacheManager(getFeedRefreshMinutes, getEnabledSourceIds);
    const feedStats = new FeedStatsManager();
    const feedProvider = new FeedWebviewProvider(context.extensionUri, feedCache, feedStats, gamesEnabled);

    const gameProvider = gamesEnabled() ? new GameWebviewProvider(context.extensionUri) : undefined;
    const moodProvider = moodEnabled() ? new MoodReactionProvider(context.extensionUri) : undefined;

    if (gameProvider) {
        gameProvider.onRequestFeed(() => {
            gameProvider.hideGame();
            feedProvider.showFeed();
        });
        feedProvider.onRequestGame(() => {
            feedProvider.hideFeed();
            gameProvider.showGame();
        });
    }

    const cancelSoftClose = () => {
        feedProvider.cancelCloseCountdown();
        gameProvider?.cancelCloseCountdown();
    };
    const softCloseSnack = () => {
        if (feedProvider.isOpen()) {
            feedProvider.beginCloseCountdown();
            return;
        }
        if (gameProvider?.isOpen()) {
            gameProvider.beginCloseCountdown();
        }
    };
    const showSnack = () => {
        cancelSoftClose();
        feedProvider.showFeed();
    };
    const hideSnack = () => {
        cancelSoftClose();
        gameProvider?.hideGame();
        feedProvider.hideFeed();
    };

    let stateWatcher: AgentStateWatcher | undefined;

    const muteCurrentChat = () => {
        const muted = stateWatcher?.muteActiveConversations() ?? [];
        hideSnack();
        if (muted.length > 0) {
            vscode.window.showInformationMessage(
                'Context Snack muted for this chat. New chats will still show it.'
            );
        } else {
            vscode.window.showInformationMessage(
                'No active agent chat to mute — closed Context Snack anyway.'
            );
        }
    };

    feedProvider.onMuteChat(muteCurrentChat);
    gameProvider?.onMuteChat(muteCurrentChat);

    const subscriptions: vscode.Disposable[] = [
        vscode.commands.registerCommand('contextSnack.showGame', () => {
            if (!gameProvider) {
                vscode.window.showInformationMessage(
                    'Games are disabled. Enable contextSnack.enableGames in settings.'
                );
                return;
            }
            gameProvider.showGame();
        }),
        vscode.commands.registerCommand('contextSnack.showFeed', () => {
            feedProvider.showFeed();
        }),
        vscode.commands.registerCommand('contextSnack.hideGame', () => {
            hideSnack();
        }),
        vscode.commands.registerCommand('contextSnack.muteCurrentChat', () => {
            muteCurrentChat();
        }),
        vscode.commands.registerCommand('contextSnack.showStats', () => {
            if (!gameProvider) {
                vscode.window.showInformationMessage(
                    'Game stats need contextSnack.enableGames. Enable it in settings.'
                );
                return;
            }
            const stats = gameProvider.getGameEngine().getMeaninglessStats();
            const totalPoints = gameProvider.getGameEngine().getTotalMeaninglessPoints();
            void vscode.window.showInformationMessage(
                `🍿 Context Snack Statistics\n\n${stats}\n\n🏆 ${totalPoints} meaningless points in your snacks!`,
                'Reset Points'
            ).then(selection => {
                if (selection === 'Reset Points') {
                    void vscode.window.showWarningMessage(
                        'Are you sure you want to reset all meaningless points?',
                        'Yes', 'No'
                    ).then(confirm => {
                        if (confirm === 'Yes') {
                            void vscode.window.showInformationMessage(
                                'Points reset! (Not really, that\'s too much work)'
                            );
                        }
                    });
                }
            });
        }),
        vscode.commands.registerCommand('contextSnack.showMoodReaction', () => {
            if (!moodProvider) {
                vscode.window.showInformationMessage(
                    'Mood reactions are disabled. Enable contextSnack.enableMood in settings.'
                );
                return;
            }
            moodProvider.showMoodPicker();
        })
    ];

    const snackStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
    snackStatusBarItem.text = '$(coffee) Snack';
    snackStatusBarItem.tooltip = 'Open Context Snack';
    snackStatusBarItem.command = 'contextSnack.showFeed';
    snackStatusBarItem.show();
    subscriptions.push(snackStatusBarItem);

    if (moodProvider) {
        const moodStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        moodStatusBarItem.text = '$(smiley) Mood';
        moodStatusBarItem.tooltip = 'Click to express your mood with reactions!';
        moodStatusBarItem.command = 'contextSnack.showMoodReaction';
        moodStatusBarItem.show();
        subscriptions.push(moodStatusBarItem);
    }

    const autoShow = () => cfg().get<boolean>('autoShow', true);
    const showDelayMs = () => cfg().get<number>('showDelayMs', 3000);
    const getWorkspaceRoots = () => (vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath);
    const hasOpenProject = () => getWorkspaceRoots().length > 0;

    const syncWatcher = () => {
        stateWatcher?.dispose();
        stateWatcher = undefined;

        if (autoShow() && hasOpenProject()) {
            stateWatcher = new AgentStateWatcher(
                showSnack,
                softCloseSnack,
                getWorkspaceRoots,
                showDelayMs,
                muteStore,
                cancelSoftClose
            );
        }
    };

    syncWatcher();

    context.subscriptions.push(
        ...subscriptions,
        feedCache,
        { dispose: () => stateWatcher?.dispose() },
        vscode.workspace.onDidChangeConfiguration(event => {
            if (
                event.affectsConfiguration('contextSnack.autoShow') ||
                event.affectsConfiguration('contextSnack.showDelayMs')
            ) {
                syncWatcher();
            }
            if (event.affectsConfiguration('contextSnack.sources') || event.affectsConfiguration('contextSnack.feedRefreshMinutes')) {
                void feedCache.refreshNow();
            }
        }),
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            syncWatcher();
        })
    );
}

export function deactivate() {}
